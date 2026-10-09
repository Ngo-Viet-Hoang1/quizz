'use client';

import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PaginatedResponse } from '@/shared/lib/api-client';
import { aiGenerationKeys, useAiGenerationApi } from '../api';
import { AiGenerationJobItem, AiGenerationJobStatus, AiGenerationQueryParams } from '../types';

export function useAiJobsHistory(params?: AiGenerationQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useAiGenerationApi();

  return useQuery<PaginatedResponse<AiGenerationJobItem[]>>({
    queryKey: aiGenerationKeys.jobList(params),
    queryFn: () => api.getJobs(params),
    enabled: isLoaded && Boolean(orgId),
    staleTime: 3000,
    refetchInterval: (query) => {
      const items = query.state.data?.data ?? [];
      const hasActiveJob = items.some(
        (j) =>
          j.status === AiGenerationJobStatus.PENDING ||
          j.status === AiGenerationJobStatus.PROCESSING,
      );
      return hasActiveJob ? 2500 : false;
    },
  });
}

export function useInfiniteAiJobsHistory(params?: Omit<AiGenerationQueryParams, 'page'>) {
  const { isLoaded, orgId } = useAuth();
  const api = useAiGenerationApi();

  return useInfiniteQuery({
    queryKey: [...aiGenerationKeys.jobs(), 'infinite', params ?? {}],
    queryFn: ({ pageParam = 1 }) =>
      api.getJobs({ ...params, page: pageParam as number, limit: params?.limit ?? 3 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: isLoaded && Boolean(orgId),
    staleTime: 3000,
    refetchInterval: (query) => {
      const pages = query.state.data?.pages ?? [];
      const hasActiveJob = pages.some((page) =>
        page.data.some(
          (j) =>
            j.status === AiGenerationJobStatus.PENDING ||
            j.status === AiGenerationJobStatus.PROCESSING,
        ),
      );
      return hasActiveJob ? 3000 : false;
    },
  });
}
