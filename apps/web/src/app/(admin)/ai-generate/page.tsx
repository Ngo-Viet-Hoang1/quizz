import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { aiGenerationKeys } from '@/features/ai-generation/api';
import { AiGeneratorView } from '@/features/ai-generation/components';
import { AiGenerationJobItem } from '@/features/ai-generation/types';

export default async function AiGeneratePage() {
  const queryClient = new QueryClient();

  try {
    const defaultParams = { limit: 3, sortBy: 'createdAt', sortOrder: 'desc' as const };
    await queryClient.prefetchInfiniteQuery({
      queryKey: [...aiGenerationKeys.jobs(), 'infinite', defaultParams],
      queryFn: () =>
        serverApiClient.getPaginated<AiGenerationJobItem[]>('/ai-generation-jobs', {
          params: { ...defaultParams, page: 1 },
        }),
      initialPageParam: 1,
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
