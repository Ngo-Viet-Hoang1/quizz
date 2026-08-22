import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  QuestionDifficulty,
  QuestionType,
  QuizDifficulty,
  QuizSourceType,
  QuizStatus,
  QuizVisibility,
} from '../enums';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema()
export class QuestionOption {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ default: false })
  isCorrect?: boolean;

  @Prop()
  orderIndex?: number;
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ _id: false })
export class QuestionMetadata {
  @Prop({ trim: true })
  correctText?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId }] })
  correctOrder?: Types.ObjectId[];
}

export const QuestionMetadataSchema = SchemaFactory.createForClass(QuestionMetadata);

@Schema()
export class Question {
  _id?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
  })
  type!: QuestionType;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ trim: true })
  explanation?: string;

  @Prop({
    type: String,
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty?: QuestionDifficulty;

  @Prop({ default: 1 })
  points?: number;

  @Prop()
  orderIndex?: number;

  @Prop({ type: [QuestionOptionSchema], default: [] })
  options?: QuestionOption[];

  @Prop({ type: QuestionMetadataSchema })
  metadata?: QuestionMetadata;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  organizationId!: string;

  @Prop({ type: String, required: true, trim: true, ref: 'User' })
  ownerId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ type: String, enum: QuizDifficulty, default: QuizDifficulty.MEDIUM })
  difficulty!: QuizDifficulty;

  @Prop({ type: String, enum: QuizSourceType, default: QuizSourceType.MANUAL })
  sourceType!: QuizSourceType;

  @Prop({ type: String, enum: QuizVisibility, default: QuizVisibility.PRIVATE })
  visibility!: QuizVisibility;

  @Prop({ type: String, enum: QuizStatus, default: QuizStatus.DRAFT })
  status!: QuizStatus;

  @Prop({ default: 1 })
  version!: number;

  @Prop({ default: 0 })
  activeRoomCount!: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: [QuestionSchema], default: [] })
  questions!: Question[];

  @Prop({ default: 0 })
  questionCount!: number;

  @Prop({ type: Number })
  timeLimitSec?: number;

  @Prop({ trim: true })
  coverImageUrl?: string;

  @Prop({ trim: true })
  shareCode?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Index definitions
QuizSchema.index(
  { organizationId: 1, deletedAt: 1, createdAt: -1 },
  { name: 'org_deleted_created_idx' },
);

QuizSchema.index({ organizationId: 1, status: 1 }, { name: 'org_status_idx' });

QuizSchema.index({ organizationId: 1, ownerId: 1 }, { name: 'org_owner_idx' });

QuizSchema.index(
  { title: 'text', description: 'text' },
  {
    weights: { title: 10, description: 5 },
    name: 'quiz_text_search_idx',
  },
);

QuizSchema.index(
  { shareCode: 1 },
  {
    unique: true,
    sparse: true,
    name: 'share_code_unique_sparse_idx',
  },
);
