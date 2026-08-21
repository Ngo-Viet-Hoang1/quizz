import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OrganizationMemberDocument = HydratedDocument<OrganizationMember>;

@Schema({
  collection: 'organization_members',
  timestamps: { createdAt: 'joinedAt', updatedAt: 'updatedAt' },
})
export class OrganizationMember {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  organizationId!: string;

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  role!: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ type: String, enum: ['active', 'removed'], default: 'active' })
  status!: 'active' | 'removed';

  joinedAt!: Date;
  updatedAt!: Date;
}

export const OrganizationMemberSchema = SchemaFactory.createForClass(OrganizationMember);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
OrganizationMemberSchema.index({ userId: 1, status: 1 });
