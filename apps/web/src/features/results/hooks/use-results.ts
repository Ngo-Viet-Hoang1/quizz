'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { PaginatedResponse } from '@/shared/lib/api-client';
import { resultKeys, useResultsApi } from '../api';
import {
  ExamAttemptDetailResponse,
  ExamAttemptItem,
  ExamAttemptQueryParams,
  GradebookQueryParams,
} from '../types';

export function useAssignmentGradebook(
  assignmentId: string,
  params?: GradebookQueryParams,
  enabled = true,
) {
  const { isLoaded, orgId } = useAuth();
  const api = useResultsApi();

  return useQuery<PaginatedResponse<ExamAttemptItem[]>>({
    queryKey: resultKeys.gradebook(assignmentId, params),
    queryFn: () => api.getAssignmentGradebook(assignmentId, params),
    enabled: isLoaded && Boolean(orgId) && Boolean(assignmentId) && enabled,
  });
}

export function useMyExamHistory(params?: ExamAttemptQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useResultsApi();

  return useQuery<PaginatedResponse<ExamAttemptItem[]>>({
    queryKey: resultKeys.history(params),
    queryFn: () => api.getMyHistory(params),
    enabled: isLoaded && Boolean(orgId),
  });
}

export function useExamAttemptDetail(attemptId: string, enabled = true) {
  const { isLoaded, orgId } = useAuth();
  const api = useResultsApi();

  return useQuery<ExamAttemptDetailResponse>({
    queryKey: resultKeys.detail(attemptId),
    queryFn: () => api.getAttemptDetail(attemptId),
    enabled: isLoaded && Boolean(orgId) && Boolean(attemptId) && enabled,
  });
}
