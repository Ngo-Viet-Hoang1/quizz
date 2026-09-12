'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { quizReportKeys, useQuizReportsApi } from '../api';
import { CreateQuizReportInput, QueryQuizReportsParams, ResolveQuizReportPayload } from '../types';

export function useQuizReports(params?: QueryQuizReportsParams) {
  const { isLoaded } = useAuth();
  const api = useQuizReportsApi();

  return useQuery({
    queryKey: quizReportKeys.list(params),
    queryFn: () => api.getReports(params),
    enabled: isLoaded,
  });
}

export function useQuizReportDetail(id: string, enabled = true) {
  const { isLoaded } = useAuth();
  const api = useQuizReportsApi();

  return useQuery({
    queryKey: quizReportKeys.detail(id),
    queryFn: () => api.getReportById(id),
    enabled: isLoaded && Boolean(id) && enabled,
  });
}

export function useCreateQuizReport() {
  const queryClient = useQueryClient();
  const api = useQuizReportsApi();

  return useMutation({
    mutationFn: (data: CreateQuizReportInput) => api.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizReportKeys.lists() });
    },
  });
}

export function useResolveQuizReport() {
  const queryClient = useQueryClient();
  const api = useQuizReportsApi();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolveQuizReportPayload }) =>
      api.resolveReport(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizReportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizReportKeys.detail(variables.id) });
    },
  });
}
