'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiGenerationKeys, useAiGenerationApi } from '../api';
import { EnqueueAiGenerationJobInput, EnqueueJobResponse } from '../types';

export function useEnqueueAiJob() {
  const api = useAiGenerationApi();
  const queryClient = useQueryClient();

  return useMutation<EnqueueJobResponse, Error, EnqueueAiGenerationJobInput>({
    mutationFn: (input: EnqueueAiGenerationJobInput) => {
      // Auto-generate idempotencyKey if not provided
      const idempotencyKey =
        input.idempotencyKey ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ai-gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

      return api.enqueueJob({
        ...input,
        model: input.model || 'claude-haiku-4-5-20251001',
        idempotencyKey,
      });
    },
    onSuccess: () => {
      // Invalidate AI job list and subscription quota queries
      queryClient.invalidateQueries({ queryKey: aiGenerationKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to enqueue AI quiz generation job');
    },
  });
}
