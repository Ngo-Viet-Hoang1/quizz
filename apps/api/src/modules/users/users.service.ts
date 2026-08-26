import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClerkUserData,
  ClerkUserDeletedData,
  ClerkWebhookEvent,
} from '../webhooks/clerk/clerk-webhook.types';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: userId, status: 'active' }).exec();
  }

  async syncFromClerk(data: {
    userId: string;
    email: string | null;
    fullName: string;
    avatarUrl?: string | null;
  }): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { _id: data.userId },
        {
          $set: {
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl ?? null,
            status: 'active',
            deletedAt: null,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec() as Promise<UserDocument>;
  }

  async addOrganization(userId: string, orgId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id: userId },
        { $addToSet: { organizationIds: orgId } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async removeOrganization(userId: string, orgId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id: userId },
        { $pull: { organizationIds: orgId } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async handleWebhookEvent(
    event: Extract<ClerkWebhookEvent, { type: `user.${string}` }>,
  ): Promise<void> {
    switch (event.type) {
      case 'user.created':
        return this.onUserCreated(event.data);
      case 'user.updated':
        return this.onUserUpdated(event.data);
      case 'user.deleted':
        return this.onUserDeleted(event.data);
    }
  }

  // ─── Private handlers ──────────────────────────────────────────────────────

  private async onUserCreated(data: ClerkUserData): Promise<void> {
    const email = this.extractPrimaryEmail(data);
    const fullName = this.extractFullName(data);

    await this.userModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            email,
            fullName,
            avatarUrl: data.image_url ?? null,
            status: 'active',
            deletedAt: null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    this.logger.debug(`User synced from Clerk: ${data.id}`);
  }

  private async onUserUpdated(data: ClerkUserData): Promise<void> {
    const email = this.extractPrimaryEmail(data);
    const fullName = this.extractFullName(data);

    await this.userModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            email,
            fullName,
            avatarUrl: data.image_url ?? null,
          },
        },
      )
      .exec();

    this.logger.debug(`User updated from Clerk: ${data.id}`);
  }

  private async onUserDeleted(data: ClerkUserDeletedData): Promise<void> {
    // Soft delete: anonymize data, free partial unique index on email
    await this.userModel
      .findOneAndUpdate(
        { _id: data.id },
        {
          $set: {
            email: null, // free unique index
            fullName: 'Deleted User',
            avatarUrl: null,
            status: 'deleted',
            deletedAt: new Date(),
          },
        },
      )
      .exec();

    this.logger.debug(`User soft-deleted from Clerk: ${data.id}`);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private extractPrimaryEmail(data: ClerkUserData): string | null {
    return (
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      null
    );
  }

  private extractFullName(data: ClerkUserData): string {
    return [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || 'User';
  }
}
