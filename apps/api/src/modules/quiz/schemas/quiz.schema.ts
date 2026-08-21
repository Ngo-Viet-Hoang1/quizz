import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type QuizDocument = HydratedDocument<Quiz>;

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  MIXED = 'mixed',
}

export enum QuizSourceType {
  MANUAL = 'manual',
  AI_GENERATED = 'ai_generated',
  AI_FROM_DOCUMENT = 'ai_from_document',
}

export enum QuizVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  ORGANIZATION = 'organization',
}

export enum QuizStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  ORDERING = 'ordering',
}

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
    required: true,
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
  })
  type!: QuestionType;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ trim: true })
  explanation?: string;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty?: string;

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

  @Prop({ trim: true })
  organizationId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ enum: QuizDifficulty, default: QuizDifficulty.MEDIUM })
  difficulty!: QuizDifficulty;

  @Prop({ enum: QuizSourceType, default: QuizSourceType.MANUAL })
  sourceType!: QuizSourceType;

  @Prop({ enum: QuizVisibility, default: QuizVisibility.PRIVATE })
  visibility!: QuizVisibility;

  @Prop({ enum: QuizStatus, default: QuizStatus.DRAFT })
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
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
