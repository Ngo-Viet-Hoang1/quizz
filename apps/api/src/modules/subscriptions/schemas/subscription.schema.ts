import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  timestamps: true,
  collection: 'subscriptions',
})
export class Subscription {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  organizationId!: string;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan!: SubscriptionPlan;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Prop({ type: Date, default: () => new Date() })
  currentPeriodStart!: Date;

  @Prop({ type: Date, default: null })
  currentPeriodEnd!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
