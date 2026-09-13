// ─── Class Types ───
export interface IClass {
  _id: string;
  organizationId: string;
  name: string;
  ownerId: string;
  status: 'active' | 'archived';
  membershipStatus?: 'active' | 'pending' | 'removed';
  code?: string;
  description?: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IClassMember {
  _id: string;
  organizationId: string;
  classId: string;
  userId: string;
  role: 'student' | 'assistant';
  status: 'active' | 'removed';
  joinedAt: string;
}

export interface IQuizAssignment {
  _id: string;
  organizationId: string;
  quizId: string;
  quizVersion: number;
  classId: string;
  assignedBy: string;
  dueAt: string | null;
  allowLateSubmit: boolean;
  createdAt: string;
}

// ─── Exam Attempt Types ───
export type ExamAttemptStatus = 'in_progress' | 'submitted' | 'abandoned' | 'force_submitted';

export interface IExamAttemptAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  orderAnswer?: string[];
  isCorrect?: boolean | null;
  timeSpentSec?: number;
  answeredAt?: string;
}

export interface IExamAttemptViolation {
  type: string;
  occurredAt: string;
}

export interface IExamAttempt {
  _id: string;
  organizationId: string;
  userId: string;
  quizId: string | { _id: string; title: string; category?: string };
  quizTitle?: string;
  quizVersion: number;
  assignmentId?: string | null;
  questionOrder: string[];
  status: ExamAttemptStatus;
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  answers: IExamAttemptAnswer[];
  violations: IExamAttemptViolation[];
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  durationSec: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Sanitized Question (returned during exam) ───
export interface SanitizedQuestionOption {
  _id: string;
  content: string;
  orderIndex?: number;
}

export interface SanitizedQuestion {
  _id: string;
  type: string;
  content: string;
  difficulty?: string;
  points?: number;
  orderIndex?: number;
  options?: SanitizedQuestionOption[];
}

// ─── Full Question (returned in review mode) ───
export interface QuestionOption {
  _id: string;
  content: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

export interface FullQuestion {
  _id: string;
  type: string;
  content: string;
  difficulty?: string;
  points?: number;
  orderIndex?: number;
  options?: QuestionOption[];
  explanation?: string;
  correctAnswer?: string;
}

// ─── API Response Types ───
export interface StartExamAttemptResponse {
  attempt: IExamAttempt;
  quizTitle: string;
  questions: SanitizedQuestion[];
}

export interface ExamAttemptDetailResponse {
  attempt: IExamAttempt;
  quizTitle: string;
  questions: (SanitizedQuestion | FullQuestion)[];
}

// ─── DTO Types ───
export interface StartExamAttemptDto {
  quizId?: string;
  assignmentId?: string;
}

export interface SubmitAnswerDto {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  orderAnswer?: string[];
  timeSpentSec?: number;
}

export interface RecordViolationDto {
  type: string;
}

// ─── Published Quiz Types (Practice / Review) ───
export interface IPublishedQuiz {
  _id: string;
  organizationId: string;
  ownerId: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: string;
  status: string;
  visibility: string;
  questionCount: number;
  timeLimitSec?: number;
  coverImageUrl?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}
