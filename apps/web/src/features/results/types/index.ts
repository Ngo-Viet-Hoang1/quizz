import { QuestionItem } from '@/features/quizzes/types';

export enum ExamAttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  ABANDONED = 'abandoned',
  FORCE_SUBMITTED = 'force_submitted',
}

export enum ViolationType {
  TAB_SWITCH = 'tab_switch',
  FULLSCREEN_EXIT = 'fullscreen_exit',
  WINDOW_BLUR = 'window_blur',
  DEVTOOLS_OPEN = 'devtools_open',
  COPY_PASTE = 'copy_paste',
  OTHER = 'other',
}

export interface ExamAttemptAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  orderAnswer?: string[];
  isCorrect?: boolean | null;
  timeSpentSec?: number;
  answeredAt?: string;
}

export interface ExamAttemptViolation {
  type: ViolationType | string;
  occurredAt: string;
}

export interface ExamAttemptItem {
  _id: string;
  organizationId: string;
  userId: string;
  quizId: string;
  quizVersion: number;
  assignmentId?: string | null;
  questionOrder: string[];
  status: ExamAttemptStatus;
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  answers: ExamAttemptAnswer[];
  violations: ExamAttemptViolation[];
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  durationSec: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamAttemptDetailResponse {
  attempt: ExamAttemptItem;
  quizTitle: string;
  questions: QuestionItem[];
}

export interface ExamAttemptQueryParams {
  page?: number;
  limit?: number;
  quizId?: string;
  assignmentId?: string;
  status?: ExamAttemptStatus | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GradebookQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GradebookSummaryStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  passRate: number;
  totalViolations: number;
}
