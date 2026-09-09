'use client';

import { useAuth } from '@clerk/nextjs';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizKeys, useQuizApi } from '../api';
import {
  CreateQuizInput,
  QuizItem,
  QuizQueryParams,
  ShareQuizResult,
  UpdateQuizInput,
} from '../types';

export function useQuizzes(params?: QuizQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useQuizApi();

  return useQuery<QuizItem[]>({
    queryKey: quizKeys.list(params),
    queryFn: () => api.getQuizzes(params),
    enabled: isLoaded && Boolean(orgId),
  });
}

export function useInfiniteQuizzes(params?: Omit<QuizQueryParams, 'page'>) {
  const { isLoaded, orgId } = useAuth();
  const api = useQuizApi();

  return useInfiniteQuery({
    queryKey: [...quizKeys.lists(), 'infinite', params ?? {}],
    queryFn: ({ pageParam = 1 }) =>
      api.getQuizzesPaginated({ ...params, page: pageParam as number, limit: params?.limit ?? 4 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: isLoaded && Boolean(orgId),
  });
}

export function useQuiz(id: string, initialData?: QuizItem) {
  const { isLoaded } = useAuth();
  const api = useQuizApi();

  return useQuery<QuizItem>({
    queryKey: quizKeys.detail(id),
    queryFn: () => api.getQuizById(id),
    enabled: isLoaded && Boolean(id),
    initialData,
  });
}

export function useCreateQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<QuizItem, Error, CreateQuizInput>({
    mutationFn: (data: CreateQuizInput) => api.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}

export function useUpdateQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<QuizItem, Error, { id: string; data: UpdateQuizInput }>({
    mutationFn: ({ id, data }) => api.updateQuiz(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.id) });
    },
  });
}

export function usePublishQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<QuizItem, Error, string>({
    mutationFn: (id: string) => api.publishQuiz(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useArchiveQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<QuizItem, Error, string>({
    mutationFn: (id: string) => api.archiveQuiz(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useCloneQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<QuizItem, Error, string>({
    mutationFn: (id: string) => api.cloneQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}

export function useShareQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<ShareQuizResult, Error, string>({
    mutationFn: (id: string) => api.shareQuiz(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useDeleteQuiz() {
  const api = useQuizApi();
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean; id: string }, Error, string>({
    mutationFn: (id: string) => api.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}
