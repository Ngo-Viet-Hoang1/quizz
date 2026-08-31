import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { resolvePermissionsForRole } from '../src/modules/organization-members/constants/role-permissions.map';
import { OrganizationMember } from '../src/modules/organization-members/schemas/organization-member.schema';
import { Organization } from '../src/modules/organizations/schemas/organization.schema';
import { User } from '../src/modules/users/schemas/user.schema';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz';

const BATCH_SIZE = 100;

async function runSync(): Promise<void> {
  console.log('----------------------------------------------------');
  console.log('🚀 [Clerk Sync] Starting Complete Data Synchronization...');
  console.log(`📡 MongoDB URI: ${MONGODB_URI}`);

  if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY is not defined in .env!');
    process.exit(1);
  }

  const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

  // Connect MongoDB
  const connection = await mongoose.connect(MONGODB_URI);
  const db = connection.connection.db;

  if (!db) {
    console.error('❌ Failed to connect to MongoDB database!');
    process.exit(1);
  }

  const usersCollection = db.collection<User>('users');
  const orgsCollection = db.collection<Organization>('organizations');
  const membersCollection = db.collection<OrganizationMember>('organization_members');

  try {
    // 1. Sync Users with Auto-Pagination (Unlimited)
    console.log('\n👤 [1/3] Syncing Users from Clerk...');
    let userOffset = 0;
    let syncedUsers = 0;
    let hasMoreUsers = true;

    while (hasMoreUsers) {
      const usersResponse = await clerkClient.users.getUserList({
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
    console.log(`   ✓ Successfully synced ${syncedUsers} users.`);

    // 2. Sync Organizations with Auto-Pagination (Unlimited)
    console.log('\n🏢 [2/3] Syncing Organizations from Clerk...');
    let orgOffset = 0;
    let syncedOrgs = 0;
    let syncedMembers = 0;
    let hasMoreOrgs = true;

    while (hasMoreOrgs) {
      const orgsResponse = await clerkClient.organizations.getOrganizationList({
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
              plan: 'free',
              aiQuotaMonthly: 100,
              aiQuotaUsed: 0,
            },
          },
          { upsert: true },
        );
        syncedOrgs++;

        // 3. Sync Memberships with Auto-Pagination for each Organization
        let memberOffset = 0;
        let hasMoreMembers = true;
        while (hasMoreMembers) {
          const membersResponse = await clerkClient.organizations.getOrganizationMembershipList({
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

            // Add orgId to user.organizationIds
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
    console.log(`   ✓ Successfully synced ${syncedOrgs} organizations.`);
    console.log(`   ✓ Successfully synced ${syncedMembers} organization memberships.`);

    console.log('\n----------------------------------------------------');
    console.log('🎉 [Clerk Sync] ALL DATA SYNCHRONIZATION COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runSync().catch(console.error);
