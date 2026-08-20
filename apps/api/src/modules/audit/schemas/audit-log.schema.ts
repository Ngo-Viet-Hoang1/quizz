import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: false,
})
export class AuditLog {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  action!: string;

  @Prop({ type: String, default: null })
  resourceType!: string | null;

  @Prop({ type: String, default: null })
  resourceId!: string | null;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ type: String, default: null })
  orgId!: string | null;

  @Prop({ type: String, default: null })
  method!: string | null;

  @Prop({ type: String, default: null })
  path!: string | null;

  @Prop({ type: Number, default: null })
  durationMs!: number | null;

  @Prop({ type: Number, default: 200 })
  statusCode!: number;

  @Prop({ type: Object, default: null })
  metadata!: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  ip!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: String, default: null })
  traceId!: string | null;

  @Prop({ type: Date, default: Date.now, required: true })
  timestamp!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ orgId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
