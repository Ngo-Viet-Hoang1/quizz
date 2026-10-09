import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  SYSTEM = 'system',
  QUIZ_INVITATION = 'quiz_invitation',
  QUIZ_RESULT = 'quiz_result',
  ORGANIZATION_INVITE = 'organization_invite',
  ORGANIZATION_UPDATE = 'organization_update',
  GENERAL = 'general',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  organizationId!: string;

  @Prop({ required: true, trim: true })
  userId!: string;

  @Prop({
    type: String,
    enum: NotificationType,
    default: NotificationType.SYSTEM,
    trim: true,
  })
  type!: NotificationType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ trim: true })
  link?: string;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ organizationId: 1, userId: 1, readAt: 1 });
NotificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
