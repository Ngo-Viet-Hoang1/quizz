'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { aiGenerationKeys, useAiGenerationApi } from '../api';
import { AiGenerationJobItem, AiGenerationQueryParams, PaginatedResult } from '../types';

export function useAiJobsHistory(params?: AiGenerationQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useAiGenerationApi();

  return useQuery<PaginatedResult<AiGenerationJobItem>>({
    queryKey: aiGenerationKeys.jobList(params),
    queryFn: () => api.getJobs(params),
    enabled: isLoaded && Boolean(orgId),
    staleTime: 5000,
  });
}
