export enum QuizStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  MIXED = 'mixed',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
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

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  ORDERING = 'ordering',
}

export interface QuestionOption {
  _id?: string;
  content: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

export interface QuestionMetadata {
  correctText?: string;
  correctOrder?: string[];
}

export interface QuestionItem {
  _id?: string;
  type: QuestionType;
  content: string;
  explanation?: string;
  difficulty?: QuestionDifficulty;
  points?: number;
  orderIndex?: number;
  options?: QuestionOption[];
  metadata?: QuestionMetadata;
}

export interface QuizItem {
  _id: string;
  organizationId: string;
  ownerId: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: QuizDifficulty;
  sourceType: QuizSourceType;
  visibility: QuizVisibility;
  status: QuizStatus;
  version: number;
  activeRoomCount: number;
  questions?: QuestionItem[];
  questionCount: number;
  timeLimitSec?: number;
  coverImageUrl?: string;
  shareCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: QuizDifficulty;
  sourceType?: QuizSourceType;
  visibility?: QuizVisibility;
  status?: QuizStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  category?: string;
  difficulty?: QuizDifficulty;
  sourceType?: QuizSourceType;
  visibility?: QuizVisibility;
  timeLimitSec?: number;
  coverImageUrl?: string;
  questions?: QuestionItem[];
}

export interface UpdateQuizInput extends Partial<CreateQuizInput> {
  status?: QuizStatus;
}

export interface ShareQuizResult {
  shareCode: string;
  shareUrl: string;
}

export interface QuizSnapshot {
  title: string;
  timeLimitSec?: number;
  questions: QuestionItem[];
}

export interface QuizVersionItem {
  _id: string;
  quizId: string;
  organizationId: string;
  version: number;
  snapshot: QuizSnapshot;
  createdAt: string;
}

export interface QuizVersionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'version';
  sortOrder?: 'asc' | 'desc';
}
