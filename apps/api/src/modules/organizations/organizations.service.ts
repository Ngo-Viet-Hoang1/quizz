import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  ) {}

  async findById(clerkOrgId: string): Promise<OrganizationDocument | null> {
    return this.organizationModel.findOne({ _id: clerkOrgId, status: 'active' }).exec();
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
    await this.organizationModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            name: data.name,
            slug: data.slug ?? null,
            logoUrl: data.image_url ?? null,
            status: 'active',
            deletedAt: null,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec();

    this.logger.debug(`Organization synced from Clerk: ${data.id}`);
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
