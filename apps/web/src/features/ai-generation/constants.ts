import { QuestionType, QuizDifficulty } from '@/features/quizzes/types';

export const DEFAULT_AI_GEN_PARAMS = {
  questionCount: 5,
  questionType: QuestionType.SINGLE_CHOICE,
  difficulty: QuizDifficulty.MEDIUM,
};

export function formatAiErrorMessage(rawError?: string | null): string {
  if (!rawError) return 'An error occurred during AI quiz generation. Quota has been refunded.';

  const lower = rawError.toLowerCase();
  if (lower.includes('quota') || lower.includes('exceeded')) {
    return 'Monthly AI quota exceeded. Please upgrade your plan.';
  }
  if (lower.includes('safety') || lower.includes('policy') || lower.includes('violated')) {
    return 'Topic violates AI content safety guidelines. Please refine your topic.';
  }
  if (lower.includes('token') || lower.includes('truncated')) {
    return 'Question batch exceeded token limit. Please reduce question count.';
  }
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return 'Request timed out. Please try again.';
  }
  if (lower.includes('not_found_error') || lower.includes('model:')) {
    return 'AI model configuration error. Please try again.';
  }
  if (lower.includes('redis') || lower.includes('queue')) {
    return 'Job queue service temporarily busy. Please retry.';
  }

  // If raw error contains JSON or technical stack info, simplify it
  if (rawError.includes('{') || rawError.includes('Error:') || rawError.length > 80) {
    return 'Failed to generate quiz. Quota has been refunded.';
  }

  return rawError;
}
