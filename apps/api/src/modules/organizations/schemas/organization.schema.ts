import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubscriptionPlan } from '@repo/shared-types';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({
  timestamps: true,
  collection: 'organizations',
  _id: false,
})
export class Organization {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: null })
  slug!: string | null;

  @Prop({ type: String, default: null })
  logoUrl!: string | null;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan!: SubscriptionPlan;

  @Prop({ type: Number, default: 100 })
  aiQuotaMonthly!: number;

  @Prop({ type: Number, default: 0 })
  aiQuotaUsed!: number;

  @Prop({
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  })
  status!: 'active' | 'deleted';

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
