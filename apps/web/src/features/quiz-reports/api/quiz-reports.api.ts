import { apiClient, useApiClient } from '@/shared/lib/api-client';
import {
  CreateQuizReportInput,
  QueryQuizReportsParams,
  QuizReportDetailData,
  QuizReportItem,
  ResolveQuizReportPayload,
} from '../types';

export const quizReportKeys = {
  all: ['quiz-reports'] as const,
  lists: () => [...quizReportKeys.all, 'list'] as const,
  list: (params?: QueryQuizReportsParams) => [...quizReportKeys.lists(), params ?? {}] as const,
  details: () => [...quizReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizReportKeys.details(), id] as const,
};

export const createQuizReportsApi = (client = apiClient) => ({
  getReports: (params?: QueryQuizReportsParams) =>
    client.getPaginated<QuizReportItem[]>('/quiz-reports', { params }),
  getReportById: (id: string) => client.get<QuizReportDetailData>(`/quiz-reports/${id}`),
  createReport: (data: CreateQuizReportInput) => client.post<QuizReportItem>('/quiz-reports', data),
  resolveReport: (id: string, data: ResolveQuizReportPayload) =>
    client.patch<QuizReportItem>(`/quiz-reports/${id}/resolve`, data),
});

export const quizReportsApi = createQuizReportsApi();
export const useQuizReportsApi = () => createQuizReportsApi(useApiClient());
