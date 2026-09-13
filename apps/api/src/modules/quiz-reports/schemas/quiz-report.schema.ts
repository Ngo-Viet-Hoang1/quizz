import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReportReason, ReportStatus } from '../enums';

export type QuizReportDocument = HydratedDocument<QuizReport>;

@Schema({ timestamps: true, collection: 'quiz_reports' })
export class QuizReport {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  quizTitle!: string;

  @Prop({ type: Number, required: true })
  quizVersion!: number;

  @Prop({ type: Types.ObjectId, required: true })
  questionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExamAttempt', default: null })
  attemptId!: Types.ObjectId | null;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, default: null })
  userName!: string | null;

  @Prop({ type: String, default: null })
  userEmail!: string | null;

  @Prop({ type: String, enum: Object.values(ReportReason), required: true })
  reason!: ReportReason;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
    index: true,
  })
  status!: ReportStatus;

  @Prop({ type: String, default: null })
  resolutionNotes!: string | null;

  @Prop({ type: String, default: null })
  resolvedBy!: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt!: Date | null;

  @Prop({ type: Number, default: 0 })
  awardedScore!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const QuizReportSchema = SchemaFactory.createForClass(QuizReport);

QuizReportSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
QuizReportSchema.index({ organizationId: 1, quizId: 1 });
