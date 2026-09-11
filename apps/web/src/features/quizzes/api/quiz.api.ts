import { apiClient, useApiClient } from '@/shared/lib/api-client';
import {
  CreateQuizInput,
  QuizItem,
  QuizQueryParams,
  QuizVersionItem,
  QuizVersionQueryParams,
  ShareQuizResult,
  UpdateQuizInput,
} from '../types';

export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (params?: QuizQueryParams) => [...quizKeys.lists(), params ?? {}] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
  versions: (id: string, params?: QuizVersionQueryParams) =>
    [...quizKeys.detail(id), 'versions', params ?? {}] as const,
  versionDetail: (id: string, version: number) =>
    [...quizKeys.detail(id), 'version', version] as const,
};

export const createQuizApi = (client = apiClient) => ({
  getQuizzes: (params?: QuizQueryParams) => client.get<QuizItem[]>('/quizzes', { params }),
  getQuizzesPaginated: (params?: QuizQueryParams) =>
    client.getPaginated<QuizItem[]>('/quizzes', { params }),
  getQuizById: (id: string) => client.get<QuizItem>(`/quizzes/${id}`),
  getQuizVersions: (id: string, params?: QuizVersionQueryParams) =>
    client.getPaginated<QuizVersionItem[]>(`/quizzes/${id}/versions`, { params }),
  getQuizVersionDetail: (id: string, version: number) =>
    client.get<QuizVersionItem>(`/quizzes/${id}/versions/${version}`),
  createQuiz: (data: CreateQuizInput) => client.post<QuizItem>('/quizzes', data),
  updateQuiz: (id: string, data: UpdateQuizInput) => client.patch<QuizItem>(`/quizzes/${id}`, data),
  publishQuiz: (id: string) => client.post<QuizItem>(`/quizzes/${id}/publish`),
  archiveQuiz: (id: string) => client.post<QuizItem>(`/quizzes/${id}/archive`),
  cloneQuiz: (id: string) => client.post<QuizItem>(`/quizzes/${id}/clone`),
  shareQuiz: (id: string) => client.post<ShareQuizResult>(`/quizzes/${id}/share`),
  deleteQuiz: (id: string) => client.delete<{ deleted: boolean; id: string }>(`/quizzes/${id}`),
});

export const quizApi = createQuizApi();
export const useQuizApi = () => createQuizApi(useApiClient());
