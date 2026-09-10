'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiGenerationKeys, useAiGenerationApi } from '../api';
import { AiGenerationJobStatus, GetJobStatusResponse } from '../types';

export function useAiJobStatus(
  jobId: string | null | undefined,
  options?: {
    enabled?: boolean;
    onCompleted?: (data: GetJobStatusResponse) => void;
    onFailed?: (data: GetJobStatusResponse) => void;
  },
) {
  const { isLoaded, orgId } = useAuth();
  const api = useAiGenerationApi();
  const queryClient = useQueryClient();

  return useQuery<GetJobStatusResponse>({
    queryKey: aiGenerationKeys.status(jobId ?? ''),
    queryFn: async () => {
      if (!jobId) throw new Error('Missing job ID');
      const res = await api.getJobStatus(jobId);

      // Trigger callbacks when reached terminal status
      if (res.status === AiGenerationJobStatus.COMPLETED) {
        options?.onCompleted?.(res);
        queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        queryClient.invalidateQueries({ queryKey: aiGenerationKeys.jobs() });
      } else if (res.status === AiGenerationJobStatus.FAILED) {
        options?.onFailed?.(res);
        queryClient.invalidateQueries({ queryKey: aiGenerationKeys.jobs() });
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      }

      return res;
    },
    enabled: isLoaded && Boolean(orgId) && Boolean(jobId) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500; // Poll initially

      // Keep polling while job is still pending or processing
      if (
        data.status === AiGenerationJobStatus.PENDING ||
        data.status === AiGenerationJobStatus.PROCESSING
      ) {
        return 1500;
      }

      // Stop polling once reached terminal state
      return false;
    },
  });
}
