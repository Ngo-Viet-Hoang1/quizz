import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { quizKeys } from '@/features/quizzes/api';
import { QuizDetailView } from '@/features/quizzes/components';
import { QuizItem } from '@/features/quizzes';

interface QuizDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: quizKeys.detail(id),
      queryFn: () => serverApiClient.get<QuizItem>(`/quizzes/${id}`),
    });
  } catch (error) {
    console.error('[QuizDetailPage] Failed to prefetch quiz on server:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <QuizDetailView quizId={id} />
    </HydrationBoundary>
  );
}
