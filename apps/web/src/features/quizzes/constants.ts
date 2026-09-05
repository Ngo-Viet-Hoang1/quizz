import { QuizQueryParams } from './types';

/**
 * Default query params shared between SSR prefetch (page.tsx) and
 * client-side QuizTable hook so they produce the same TanStack Query cache key.
 */
export const DEFAULT_QUIZ_PARAMS: QuizQueryParams = {
  sortBy: 'updatedAt',
  sortOrder: 'asc',
};
