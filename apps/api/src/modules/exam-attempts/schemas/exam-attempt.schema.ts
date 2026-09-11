import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { ExamAttemptAnswer, ExamAttemptAnswerSchema } from './exam-attempt-answer.schema';
import { ExamAttemptViolation, ExamAttemptViolationSchema } from './exam-attempt-violation.schema';

export type ExamAttemptDocument = HydratedDocument<ExamAttempt>;

@Schema({ collection: 'exam_attempts', timestamps: false })
export class ExamAttempt {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  quizVersion!: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'QuizAssignment', default: null, index: true })
  assignmentId?: Types.ObjectId | null;

  @Prop({ type: [{ type: SchemaTypes.ObjectId }], default: [] })
  questionOrder!: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ExamAttemptStatus,
    default: ExamAttemptStatus.IN_PROGRESS,
    required: true,
  })
  status!: ExamAttemptStatus;

  @Prop({ type: Number, default: 0 })
  score!: number;

  @Prop({ type: Number, default: 0 })
  totalPoints!: number;

  @Prop({ type: Number, default: 0 })
  correctCount!: number;

  @Prop({ type: Number, default: 0 })
  wrongCount!: number;

  @Prop({ type: [ExamAttemptAnswerSchema], default: [] })
  answers!: ExamAttemptAnswer[];

  @Prop({ type: [ExamAttemptViolationSchema], default: [] })
  violations!: ExamAttemptViolation[];

  @Prop({ type: Date, default: Date.now, required: true })
  startedAt!: Date;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  durationSec!: number;
}

export const ExamAttemptSchema = SchemaFactory.createForClass(ExamAttempt);

// Indexes defined in Schema specification
ExamAttemptSchema.index({ organizationId: 1, userId: 1 });
ExamAttemptSchema.index({ organizationId: 1, quizId: 1 });
ExamAttemptSchema.index({ organizationId: 1, assignmentId: 1 });
ExamAttemptSchema.index(
  { expiresAt: 1 },
  { partialFilterExpression: { status: ExamAttemptStatus.IN_PROGRESS } },
);
