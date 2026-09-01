import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ClerkClient } from '@clerk/backend';
import { SubscriptionPlan } from '@repo/shared-types';
import { CLERK_CLIENT } from '../../../common/clerk/clerk-client.provider';
import { resolvePermissionsForRole } from '../../organization-members/constants/role-permissions.map';
import { OrganizationMember } from '../../organization-members/schemas/organization-member.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { User } from '../../users/schemas/user.schema';

export interface SyncClerkResult {
  syncedUsers: number;
  syncedOrgs: number;
  syncedMembers: number;
  durationMs: number;
}

const BATCH_SIZE = 100;

@Injectable()
export class ClerkSyncService {
  private readonly logger = new Logger(ClerkSyncService.name);

  constructor(
    @Inject(CLERK_CLIENT) private readonly clerkClient: ClerkClient,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async syncAll(): Promise<SyncClerkResult> {
    const startTime = Date.now();
    const db = this.connection.db;

    if (!db) {
      throw new Error('Database connection is not available');
    }

    const usersCollection = db.collection<User>('users');
    const orgsCollection = db.collection<Organization>('organizations');
    const membersCollection = db.collection<OrganizationMember>('organization_members');

    // 1. Sync Users with Auto-Pagination
    let userOffset = 0;
    let syncedUsers = 0;
    let hasMoreUsers = true;

    while (hasMoreUsers) {
      const usersResponse = await this.clerkClient.users.getUserList({
        limit: BATCH_SIZE,
        offset: userOffset,
      });
      const users = usersResponse.data;
      if (!users || users.length === 0) {
        hasMoreUsers = false;
        break;
      }

      for (const user of users) {
        const email =
          user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
          user.emailAddresses?.[0]?.emailAddress ??
          null;

        const fullName =
          [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'User';

        await usersCollection.updateOne(
          { _id: user.id },
          {
            $set: {
              email,
              fullName,
              avatarUrl: user.imageUrl ?? null,
              status: user.banned ? 'blocked' : 'active',
              deletedAt: null,
            },
            $setOnInsert: {
              organizationIds: [],
            },
          },
          { upsert: true },
        );
        syncedUsers++;
      }

      if (users.length < BATCH_SIZE) {
        hasMoreUsers = false;
      } else {
        userOffset += BATCH_SIZE;
      }
    }

    // 2. Sync Organizations with Auto-Pagination
    let orgOffset = 0;
    let syncedOrgs = 0;
    let syncedMembers = 0;
    let hasMoreOrgs = true;

    while (hasMoreOrgs) {
      const orgsResponse = await this.clerkClient.organizations.getOrganizationList({
        limit: BATCH_SIZE,
        offset: orgOffset,
      });
      const orgs = orgsResponse.data;
      if (!orgs || orgs.length === 0) {
        hasMoreOrgs = false;
        break;
      }

      for (const org of orgs) {
        await orgsCollection.updateOne(
          { _id: org.id },
          {
            $set: {
              name: org.name,
              slug: org.slug ?? null,
              logoUrl: org.imageUrl ?? null,
              status: 'active',
              deletedAt: null,
            },
            $setOnInsert: {
              plan: SubscriptionPlan.FREE,
              aiQuotaMonthly: 100,
              aiQuotaUsed: 0,
            },
          },
          { upsert: true },
        );
        syncedOrgs++;

        // 3. Sync Memberships with Auto-Pagination
        let memberOffset = 0;
        let hasMoreMembers = true;
        while (hasMoreMembers) {
          const membersResponse =
            await this.clerkClient.organizations.getOrganizationMembershipList({
              organizationId: org.id,
              limit: BATCH_SIZE,
              offset: memberOffset,
            });
          const members = membersResponse.data;
          if (!members || members.length === 0) {
            hasMoreMembers = false;
            break;
          }

          for (const member of members) {
            const userId = member.publicUserData?.userId;
            if (!userId) continue;

            const role = member.role;
            const permissions = resolvePermissionsForRole(role);

            await membersCollection.updateOne(
              { organizationId: org.id, userId },
              {
                $set: {
                  role,
                  permissions,
                  status: 'active',
                },
                $setOnInsert: {
                  organizationId: org.id,
                  userId,
                },
              },
              { upsert: true },
            );

            await usersCollection.updateOne(
              { _id: userId },
              { $addToSet: { organizationIds: org.id } },
            );

            syncedMembers++;
          }

          if (members.length < BATCH_SIZE) {
            hasMoreMembers = false;
          } else {
            memberOffset += BATCH_SIZE;
          }
        }
      }

      if (orgs.length < BATCH_SIZE) {
        hasMoreOrgs = false;
      } else {
        orgOffset += BATCH_SIZE;
      }
    }

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `Clerk sync completed: ${syncedUsers} users, ${syncedOrgs} orgs, ${syncedMembers} members in ${durationMs}ms`,
    );

    return {
      syncedUsers,
      syncedOrgs,
      syncedMembers,
      durationMs,
    };
  }
}
