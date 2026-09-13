import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClerkClient } from '@clerk/backend';
import { CLERK_CLIENT } from '../../common/clerk/clerk-client.provider';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { UsersService } from '../users/users.service';
import {
  ClerkOrganizationData,
  ClerkOrganizationDeletedData,
  ClerkWebhookEvent,
} from '../webhooks/clerk/clerk-webhook.types';
import { Organization, OrganizationDocument } from './schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @Inject(CLERK_CLIENT)
    private readonly clerkClient: ClerkClient,
    private readonly orgMembersService: OrganizationMembersService,
    private readonly usersService: UsersService,
  ) {}

  async findById(clerkOrgId: string): Promise<OrganizationDocument | null> {
    return this.organizationModel.findOne({ _id: clerkOrgId, status: 'active' }).exec();
  }

  async findPublicOrganizations(search?: string, limit = 50): Promise<OrganizationDocument[]> {
    const filter: Record<string, unknown> = { status: 'active', deletedAt: null };
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    return this.organizationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id name slug logoUrl createdAt')
      .exec();
  }

  async joinOrganizationAsStudent(
    orgId: string,
    userId: string,
  ): Promise<{ success: boolean; organization: OrganizationDocument }> {
    const org = await this.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${orgId} not found or inactive`);
    }

    // 1. Add membership in Clerk with role org:member
    try {
      await this.clerkClient.organizations.createOrganizationMembership({
        organizationId: orgId,
        userId,
        role: 'org:member',
      });
      this.logger.log(`Created Clerk membership for user ${userId} in org ${orgId}`);
    } catch (error: unknown) {
      this.logger.warn(
        `Clerk createOrganizationMembership info for ${userId} in ${orgId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // 2. Sync membership in local database with role org:member
    await this.orgMembersService.syncMember({
      organizationId: orgId,
      userId,
      role: 'org:member',
    });

    // 3. Ensure organization is in user.organizationIds
    await this.usersService.addOrganization(userId, orgId);

    return {
      success: true,
      organization: org,
    };
  }

  async syncFromClerk(data: {
    id: string;
    name: string;
    slug?: string | null;
    logoUrl?: string | null;
  }): Promise<OrganizationDocument> {
    const org = (await this.organizationModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            name: data.name,
            slug: data.slug ?? null,
            logoUrl: data.logoUrl ?? null,
            status: 'active',
            deletedAt: null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec()) as OrganizationDocument;

    this.logger.debug(`Organization synced from Clerk: ${data.id}`);
    return org;
  }

  async handleWebhookEvent(
    event: Extract<ClerkWebhookEvent, { type: `organization.${string}` }>,
  ): Promise<void> {
    switch (event.type) {
      case 'organization.created':
        return this.onOrgCreated(event.data);
      case 'organization.updated':
        return this.onOrgUpdated(event.data);
      case 'organization.deleted':
        return this.onOrgDeleted(event.data);
    }
  }

  // ─── Private handlers ──────────────────────────────────────────────────────

  private async onOrgCreated(data: ClerkOrganizationData): Promise<void> {
    await this.syncFromClerk({
      id: data.id,
      name: data.name,
      slug: data.slug ?? null,
      logoUrl: data.image_url ?? null,
    });
  }

  private async onOrgUpdated(data: ClerkOrganizationData): Promise<void> {
    await this.organizationModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            name: data.name,
            slug: data.slug ?? null,
            logoUrl: data.image_url ?? null,
          },
        },
      )
      .exec();

    this.logger.debug(`Organization updated from Clerk: ${data.id}`);
  }

  private async onOrgDeleted(data: ClerkOrganizationDeletedData): Promise<void> {
    await this.organizationModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            status: 'deleted',
            deletedAt: new Date(),
          },
        },
      )
      .exec();

    this.logger.debug(`Organization soft-deleted from Clerk: ${data.id}`);
  }
}
