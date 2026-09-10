import { Types } from 'mongoose';
import { QuizAssignmentDocument } from '../../classes/schemas/quiz-assignment.schema';
import { Question } from '../../quiz/schemas/quiz.schema';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';

export interface IExamAttemptAnswer {
  questionId: Types.ObjectId | string;
  selectedOptionIds?: (Types.ObjectId | string)[];
  textAnswer?: string | null;
  orderAnswer?: (Types.ObjectId | string)[];
  isCorrect?: boolean | null;
  timeSpentSec?: number;
  answeredAt?: Date;
}

export interface IExamAttemptViolation {
  type: string;
  occurredAt: Date;
}

export interface IExamAttempt {
  _id: Types.ObjectId | string;
  organizationId: string;
  userId: string;
  quizId: Types.ObjectId | string;
  quizVersion: number;
  assignmentId?: Types.ObjectId | string | null;
  questionOrder: (Types.ObjectId | string)[];
  status: ExamAttemptStatus;
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  answers: IExamAttemptAnswer[];
  violations: IExamAttemptViolation[];
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date | null;
  durationSec: number;
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface StartExamAttemptResponse {
  attempt: IExamAttempt;
  quizTitle: string;
  questions: SanitizedQuestion[];
}

export interface ExamContext {
  quizId: Types.ObjectId;
  quizVersion: number;
  assignment: QuizAssignmentDocument | null;
}

export interface GradingResult {
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  answers: IExamAttemptAnswer[];
}

export interface ExamAttemptDetailResponse {
  attempt: IExamAttempt;
  quizTitle: string;
  questions: (SanitizedQuestion | Question)[];
}
