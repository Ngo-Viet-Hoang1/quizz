import { apiClient, useApiClient } from '@/shared/lib/api-client';
import {
  ExamAttemptDetailResponse,
  ExamAttemptItem,
  ExamAttemptQueryParams,
  GradebookQueryParams,
} from '../types';

export const resultKeys = {
  all: ['exam-attempts'] as const,
  gradebooks: () => [...resultKeys.all, 'gradebook'] as const,
  gradebook: (assignmentId: string, params?: GradebookQueryParams) =>
    [...resultKeys.gradebooks(), assignmentId, params ?? {}] as const,
  histories: () => [...resultKeys.all, 'history'] as const,
  history: (params?: ExamAttemptQueryParams) => [...resultKeys.histories(), params ?? {}] as const,
  details: () => [...resultKeys.all, 'detail'] as const,
  detail: (id: string) => [...resultKeys.details(), id] as const,
};

export const createResultsApi = (client = apiClient) => ({
  getAssignmentGradebook: (assignmentId: string, params?: GradebookQueryParams) =>
    client.getPaginated<ExamAttemptItem[]>(`/exam-attempts/assignment/${assignmentId}`, {
      params,
    }),
  getMyHistory: (params?: ExamAttemptQueryParams) =>
    client.getPaginated<ExamAttemptItem[]>('/exam-attempts/my-history', { params }),
  getAttemptDetail: (attemptId: string) =>
    client.get<ExamAttemptDetailResponse>(`/exam-attempts/${attemptId}`),
});

export const resultsApi = createResultsApi();
export const useResultsApi = () => createResultsApi(useApiClient());
