import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Question, QuestionSchema } from './quiz.schema';

export type QuizVersionDocument = HydratedDocument<QuizVersion>;

@Schema({ _id: false })
export class QuizSnapshot {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Number })
  timeLimitSec?: number;

  @Prop({ type: [QuestionSchema], default: [] })
  questions!: Question[];
}

export const QuizSnapshotSchema = SchemaFactory.createForClass(QuizSnapshot);

@Schema({ collection: 'quiz_versions', timestamps: { createdAt: true, updatedAt: false } })
export class QuizVersion {
  _id!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: Number, required: true })
  version!: number;

  @Prop({ type: QuizSnapshotSchema, required: true })
  snapshot!: QuizSnapshot;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const QuizVersionSchema = SchemaFactory.createForClass(QuizVersion);

QuizVersionSchema.index({ quizId: 1, version: 1 }, { unique: true });
