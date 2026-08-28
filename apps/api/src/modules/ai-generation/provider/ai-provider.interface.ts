import { QuestionType, QuizDifficulty } from '../../quiz/enums';

export interface AiGeneratedOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface AiGeneratedQuestion {
  text: string;
  type: QuestionType;
  points: number;
  explanation?: string;
  options: AiGeneratedOption[];
}

export interface AiGenerationResult {
  questions: AiGeneratedQuestion[];
  rawResponse: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface IAiProvider {
  generateQuiz(
    topic: string,
    questionCount: number,
    questionType: QuestionType,
    difficulty: QuizDifficulty,
    model?: string,
  ): Promise<AiGenerationResult>;
}
