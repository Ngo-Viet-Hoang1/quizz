import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ClerkOrgMembershipData, ClerkWebhookEvent } from '../webhooks/clerk/clerk-webhook.types';
import { resolvePermissionsForRole } from './constants/role-permissions.map';
import {
  OrganizationMember,
  OrganizationMemberDocument,
} from './schemas/organization-member.schema';

@Injectable()
export class OrganizationMembersService {
  private readonly logger = new Logger(OrganizationMembersService.name);

  constructor(
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,
    private readonly usersService: UsersService,
  ) {}

  async findByOrgAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberDocument | null> {
    return this.memberModel.findOne({ organizationId, userId, status: 'active' }).exec();
  }

  async handleWebhookEvent(
    event: Extract<ClerkWebhookEvent, { type: `organizationMembership.${string}` }>,
  ): Promise<void> {
    switch (event.type) {
      case 'organizationMembership.created':
        return this.onMembershipCreated(event.data);
      case 'organizationMembership.updated':
        return this.onMembershipUpdated(event.data);
      case 'organizationMembership.deleted':
        return this.onMembershipDeleted(event.data);
    }
  }

  // ─── Private handlers ──────────────────────────────────────────────────────

  private async onMembershipCreated(data: ClerkOrgMembershipData): Promise<void> {
    const organizationId = data.organization.id;
    const userId = data.public_user_data.user_id;
    const permissions = resolvePermissionsForRole(data.role);

    await this.memberModel
      .findOneAndUpdate(
        { organizationId, userId },
        {
          $set: {
            role: data.role,
            permissions,
            status: 'active',
          },
          $setOnInsert: {
            organizationId,
            userId,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec();

    await this.usersService.addOrganization(userId, organizationId);

    this.logger.debug(
      `Member created/synced: ${userId} in ${organizationId} with role ${data.role}`,
    );
  }

  private async onMembershipUpdated(data: ClerkOrgMembershipData): Promise<void> {
    const organizationId = data.organization.id;
    const userId = data.public_user_data.user_id;
    const permissions = resolvePermissionsForRole(data.role);

    await this.memberModel
      .findOneAndUpdate(
        { organizationId, userId },
        {
          $set: {
            role: data.role,
            permissions,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();

    this.logger.debug(`Member updated: ${userId} in ${organizationId} with new role ${data.role}`);
  }

  private async onMembershipDeleted(data: ClerkOrgMembershipData): Promise<void> {
    const organizationId = data.organization.id;
    const userId = data.public_user_data.user_id;

    await this.memberModel
      .findOneAndUpdate(
        { organizationId, userId },
        {
          $set: {
            status: 'removed',
          },
        },
        { returnDocument: 'after' },
      )
      .exec();

    await this.usersService.removeOrganization(userId, organizationId);

    this.logger.debug(`Member removed: ${userId} from ${organizationId}`);
  }
}
