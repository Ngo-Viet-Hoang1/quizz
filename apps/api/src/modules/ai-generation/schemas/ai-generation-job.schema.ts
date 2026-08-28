import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { AiGenerationJobStatus } from '../enums';

export type AiGenerationJobDocument = HydratedDocument<AiGenerationJob>;

@Schema({ timestamps: true, collection: 'ai_generation_jobs' })
export class AiGenerationJob {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  organizationId!: string;

  @Prop({ required: true, trim: true })
  userId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quiz', default: null })
  quizId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  idempotencyKey!: string;

  @Prop({ required: true, trim: true })
  prompt!: string;

  @Prop({ required: true, type: Number })
  questionCount!: number;

  @Prop({ required: true, trim: true })
  model!: string;

  @Prop({
    type: String,
    enum: AiGenerationJobStatus,
    default: AiGenerationJobStatus.PENDING,
    required: true,
  })
  status!: AiGenerationJobStatus;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  rawResponse?: Record<string, unknown> | null;

  @Prop({ type: Number, default: 0 })
  inputTokens?: number;

  @Prop({ type: Number, default: 0 })
  outputTokens?: number;

  @Prop({ type: Number, default: 0 })
  costUsd?: number;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({ type: Boolean, default: false })
  quotaRefunded?: boolean;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AiGenerationJobSchema = SchemaFactory.createForClass(AiGenerationJob);

AiGenerationJobSchema.index({ organizationId: 1, createdAt: -1 });
AiGenerationJobSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true });
