import { QuestionType, QuizDifficulty } from '../../quiz/enums';

export interface AiGenerationJobPayload {
  jobId: string;
  organizationId: string;
  userId: string;
  topic: string;
  questionCount: number;
  questionType: QuestionType;
  difficulty: QuizDifficulty;
  prompt: string;
  model: string;
  idempotencyKey: string;
}
