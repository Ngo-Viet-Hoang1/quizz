import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SubscriptionHistoryDocument = HydratedDocument<SubscriptionHistory>;

export enum SubscriptionChangeType {
  INITIAL = 'initial',
  UPGRADE = 'upgrade',
  RENEWAL = 'renewal',
  EXPIRED_DOWNGRADE = 'expired_downgrade',
  REFUND_DOWNGRADE = 'refund_downgrade',
  DEV_RESET = 'dev_reset',
}

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'subscription_histories',
})
export class SubscriptionHistory {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: null,
  })
  fromPlan?: SubscriptionPlan | null;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    required: true,
  })
  toPlan!: SubscriptionPlan;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: null,
  })
  fromStatus?: SubscriptionStatus | null;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    required: true,
  })
  toStatus!: SubscriptionStatus;

  @Prop({
    type: String,
    enum: SubscriptionChangeType,
    required: true,
    index: true,
  })
  changeType!: SubscriptionChangeType;

  @Prop({ type: String, default: null, index: true })
  transactionId?: string | null;

  @Prop({ type: Date, default: null })
  currentPeriodStart?: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd?: Date | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, unknown>;

  createdAt!: Date;
}

export const SubscriptionHistorySchema = SchemaFactory.createForClass(SubscriptionHistory);
SubscriptionHistorySchema.index({ organizationId: 1, createdAt: -1 });
