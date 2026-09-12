'use client';

import { useApiClient } from '@/shared/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExamAttemptDetailResponse,
  IClass,
  IClassMember,
  IExamAttempt,
  IQuizAssignment,
  RecordViolationDto,
  StartExamAttemptDto,
  StartExamAttemptResponse,
  SubmitAnswerDto,
} from '../types';

// ─── Query Keys ───
export const studentKeys = {
  enrolledClasses: (params?: Record<string, unknown>) =>
    ['student', 'enrolled-classes', params] as const,
  allClasses: (params?: Record<string, unknown>) => ['student', 'all-classes', params] as const,
  classDetail: (id: string) => ['student', 'class', id] as const,
  classAssignments: (classId: string, params?: Record<string, unknown>) =>
    ['student', 'class-assignments', classId, params] as const,
  classMembers: (classId: string) => ['student', 'class-members', classId] as const,
  myHistory: (params?: Record<string, unknown>) => ['student', 'my-history', params] as const,
  attemptDetail: (id: string) => ['student', 'attempt', id] as const,
};

// ─── Enrolled Classes ───
export function useEnrolledClasses(params?: { page?: number; limit?: number; search?: string }) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.enrolledClasses(params),
    queryFn: () => api.getPaginated<IClass[]>('/classes/enrolled', { params }),
  });
}

// ─── Search All Classes ───
export function useSearchClasses(params?: { page?: number; limit?: number; search?: string }) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.allClasses(params),
    queryFn: () => api.getPaginated<IClass[]>('/classes', { params }),
    enabled: !!params?.search,
  });
}

// ─── Class Detail ───
export function useClassDetail(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.classDetail(id),
    queryFn: () => api.get<IClass>(`/classes/${id}`),
    enabled: !!id,
  });
}

// ─── Class Assignments ───
export function useClassAssignments(classId: string, params?: { page?: number; limit?: number }) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.classAssignments(classId, params),
    queryFn: () =>
      api.getPaginated<IQuizAssignment[]>(`/classes/${classId}/assignments`, { params }),
    enabled: !!classId,
  });
}

// ─── Class Members ───
export function useClassMembers(classId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.classMembers(classId),
    queryFn: () =>
      api.getPaginated<IClassMember[]>(`/classes/${classId}/members`, { params: { limit: 100 } }),
    enabled: !!classId,
  });
}

// ─── Join Class ───
export function useJoinClass() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => api.post<IClassMember>(`/classes/${classId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'enrolled-classes'] });
    },
  });
}

// ─── Leave Class ───
export function useLeaveClass() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => api.post<IClassMember>(`/classes/${classId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'enrolled-classes'] });
    },
  });
}

// ─── Start Exam Attempt ───
export function useStartExamAttempt() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (dto: StartExamAttemptDto) =>
      api.post<StartExamAttemptResponse>('/exam-attempts/start', dto),
  });
}

// ─── Save Answer ───
export function useSaveAnswer(attemptId: string) {
  const api = useApiClient();
  return useMutation({
    mutationFn: (dto: SubmitAnswerDto) =>
      api.put<IExamAttempt>(`/exam-attempts/${attemptId}/answer`, dto),
  });
}

// ─── Record Violation ───
export function useRecordViolation(attemptId: string) {
  const api = useApiClient();
  return useMutation({
    mutationFn: (dto: RecordViolationDto) =>
      api.post<IExamAttempt>(`/exam-attempts/${attemptId}/violations`, dto),
  });
}

// ─── Submit Exam ───
export function useSubmitExam() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => api.post<IExamAttempt>(`/exam-attempts/${attemptId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'my-history'] });
    },
  });
}

// ─── My Exam History ───
export function useMyExamHistory(params?: { page?: number; limit?: number; status?: string }) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.myHistory(params),
    queryFn: () => api.getPaginated<IExamAttempt[]>('/exam-attempts/my-history', { params }),
  });
}

// ─── Exam Attempt Detail ───
export function useAttemptDetail(attemptId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: studentKeys.attemptDetail(attemptId),
    queryFn: () => api.get<ExamAttemptDetailResponse>(`/exam-attempts/${attemptId}`),
    enabled: !!attemptId,
  });
}
