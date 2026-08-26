import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ExamAttemptStatus } from '../enums';

export type ExamAttemptDocument = HydratedDocument<ExamAttempt>;

@Schema({ timestamps: true, collection: 'exam_attempts' })
export class ExamAttempt {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  organizationId!: string;

  @Prop({ required: true, trim: true })
  userId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quiz', required: true })
  quizId!: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quizVersion!: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  assignmentId?: Types.ObjectId | null;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId }], default: [] })
  questionOrder?: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ExamAttemptStatus,
    default: ExamAttemptStatus.IN_PROGRESS,
    required: true,
  })
  status!: ExamAttemptStatus;

  @Prop({ type: Date, default: Date.now })
  startedAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Number })
  durationSec?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExamAttemptSchema = SchemaFactory.createForClass(ExamAttempt);

ExamAttemptSchema.index({ organizationId: 1, userId: 1 });
ExamAttemptSchema.index({ organizationId: 1, quizId: 1 });
ExamAttemptSchema.index({ organizationId: 1, assignmentId: 1 });
ExamAttemptSchema.index(
  { expiresAt: 1 },
  { partialFilterExpression: { status: ExamAttemptStatus.IN_PROGRESS } },
);
