import {
  QuestionDifficulty,
  QuestionType,
  QuizDifficulty,
  QuizSourceType,
  QuizStatus,
  QuizVisibility,
} from '../enums';

export interface IQuestionOption {
  _id?: string;
  content: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

export interface IQuestionMetadata {
  correctText?: string;
  correctOrder?: string[];
}

export interface IQuestion {
  _id?: string;
  type: QuestionType;
  content: string;
  explanation?: string;
  difficulty?: QuestionDifficulty;
  points?: number;
  orderIndex?: number;
  options?: IQuestionOption[];
  metadata?: IQuestionMetadata;
}

export interface IQuiz {
  _id?: string;
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
  deletedAt?: Date | null;
  questions?: IQuestion[];
  questionCount: number;
  timeLimitSec?: number;
  coverImageUrl?: string;
  shareCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
