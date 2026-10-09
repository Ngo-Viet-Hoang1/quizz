'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { PaginatedResponse } from '@/shared/lib/api-client';
import { quizKeys, useQuizApi } from '../api';
import { QuizVersionItem, QuizVersionQueryParams } from '../types';

export function useQuizVersions(quizId: string, params?: QuizVersionQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useQuizApi();

  return useQuery<PaginatedResponse<QuizVersionItem[]>>({
    queryKey: quizKeys.versions(quizId, params),
    queryFn: () => api.getQuizVersions(quizId, params),
    enabled: isLoaded && Boolean(orgId) && Boolean(quizId),
  });
}

export function useQuizVersionDetail(quizId: string, version: number, enabled = true) {
  const { isLoaded, orgId } = useAuth();
  const api = useQuizApi();

  return useQuery<QuizVersionItem>({
    queryKey: quizKeys.versionDetail(quizId, version),
    queryFn: () => api.getQuizVersionDetail(quizId, version),
    enabled: isLoaded && Boolean(orgId) && Boolean(quizId) && version > 0 && enabled,
  });
}
