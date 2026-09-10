import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { aiGenerationKeys } from '@/features/ai-generation/api';
import { AiGeneratorView } from '@/features/ai-generation/components';
import { AiGenerationJobItem, PaginatedResult } from '@/features/ai-generation/types';

export default async function AiGeneratePage() {
  const queryClient = new QueryClient();

  try {
    const defaultParams = { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' as const };
    await queryClient.prefetchQuery({
      queryKey: aiGenerationKeys.jobList(defaultParams),
      queryFn: () =>
        serverApiClient.get<PaginatedResult<AiGenerationJobItem>>('/ai-generation-jobs', {
          params: defaultParams,
        }),
    });
  } catch (error) {
    console.error('[AiGeneratePage] Failed to prefetch AI generation jobs on server:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AiGeneratorView />
    </HydrationBoundary>
  );
}
