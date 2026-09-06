import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { quizKeys } from '@/features/quizzes/api';
import { QuizListView } from '@/features/quizzes/components';
import { DEFAULT_QUIZ_PARAMS, QuizItem } from '@/features/quizzes';

export default async function QuizzesPage() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: quizKeys.list(DEFAULT_QUIZ_PARAMS),
      queryFn: () => serverApiClient.get<QuizItem[]>('/quizzes', { params: DEFAULT_QUIZ_PARAMS }),
    });
  } catch (error) {
    console.error('[QuizzesPage] Failed to prefetch quizzes on server:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <QuizListView />
    </HydrationBoundary>
  );
}
