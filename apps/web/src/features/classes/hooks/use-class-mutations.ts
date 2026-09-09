'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classKeys, useClassApi } from '../api';
import {
  AddClassMemberInput,
  AssignQuizInput,
  ClassAssignmentItem,
  ClassItem,
  ClassMemberItem,
  CreateClassInput,
  UpdateClassInput,
} from '../types';

export function useCreateClass() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassItem, Error, CreateClassInput>({
    mutationFn: (data: CreateClassInput) => api.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useUpdateClass() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassItem, Error, { id: string; data: UpdateClassInput }>({
    mutationFn: ({ id, data }) => api.updateClass(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(variables.id) });
    },
  });
}

export function useArchiveClass() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassItem, Error, string>({
    mutationFn: (id: string) => api.archiveClass(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
    },
  });
}

export function useAddClassMember() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassMemberItem, Error, { classId: string; data: AddClassMemberInput }>({
    mutationFn: ({ classId, data }) => api.addMember(classId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.membersLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}

export function useRemoveClassMember() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassMemberItem, Error, { classId: string; userId: string }>({
    mutationFn: ({ classId, userId }) => api.removeMember(classId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.membersLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}

export function useApproveClassMember() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassMemberItem, Error, { classId: string; userId: string }>({
    mutationFn: ({ classId, userId }) => api.approveMember(classId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.membersLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}

export function useRejectClassMember() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassMemberItem, Error, { classId: string; userId: string }>({
    mutationFn: ({ classId, userId }) => api.rejectMember(classId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.membersLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}

export function useAssignQuizToClass() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<ClassAssignmentItem, Error, { classId: string; data: AssignQuizInput }>({
    mutationFn: ({ classId, data }) => api.assignQuiz(classId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.assignmentsLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}

export function useRemoveClassAssignment() {
  const api = useClassApi();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { classId: string; assignmentId: string }>({
    mutationFn: ({ classId, assignmentId }) => api.removeAssignment(classId, assignmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.assignmentsLists(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(variables.classId),
      });
    },
  });
}
