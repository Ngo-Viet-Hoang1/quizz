export enum ReportReason {
  INCORRECT_ANSWER = 'INCORRECT_ANSWER',
  UNCLEAR_QUESTION = 'UNCLEAR_QUESTION',
  TYPO = 'TYPO',
  OUTDATED_CONTENT = 'OUTDATED_CONTENT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface QuizReportItem {
  _id: string;
  organizationId: string;
  quizId: string;
  quizTitle?: string;
  quizVersion: number;
  questionId: string;
  attemptId?: string | null;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  reason: ReportReason;
  description: string;
  comment?: string;
  status: ReportStatus;
  resolutionNotes?: string | null;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  awardedScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizReportInput {
  quizId: string;
  quizVersion: number;
  questionId: string;
  attemptId?: string;
  reason: ReportReason;
  description: string;
}

export interface QueryQuizReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  reason?: ReportReason;
  quizId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ResolveQuizReportPayload {
  status: ReportStatus;
  resolutionNotes?: string;
  resolutionNote?: string;
}

export interface QuizReportQuestionOption {
  _id?: string;
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface QuizReportQuestion {
  _id: string;
  content: string;
  type?: string;
  points?: number;
  explanation?: string;
  options?: QuizReportQuestionOption[];
}

export interface QuizReportDetailData {
  report: QuizReportItem;
  question?: QuizReportQuestion;
  latestVersion?: number;
  quizTitle?: string;
  reporterName?: string;
  reporterEmail?: string;
}
