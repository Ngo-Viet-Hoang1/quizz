import { QuestionType, QuizDifficulty } from '@/features/quizzes/types';

export enum AiGenerationJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface EnqueueAiGenerationJobInput {
  idempotencyKey?: string;
  topic: string;
  questionCount: number;
  questionType?: QuestionType;
  difficulty?: QuizDifficulty;
  model?: string;
}

export interface EnqueueJobResponse {
  jobId: string;
  status: AiGenerationJobStatus | string;
  quizId?: string | null;
}

export interface GetJobStatusResponse {
  jobId: string;
  status: AiGenerationJobStatus | string;
  quizId: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface AiGenerationJobItem {
  _id: string;
  organizationId: string;
  userId: string;
  quizId?: string | null;
  idempotencyKey: string;
  prompt: string;
  questionCount: number;
  model: string;
  status: AiGenerationJobStatus;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  errorMessage?: string | null;
  quotaRefunded?: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiGenerationQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
