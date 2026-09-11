import { apiClient, useApiClient } from '@/shared/lib/api-client';
import {
  AddClassMemberInput,
  AssignQuizInput,
  ClassAssignmentItem,
  ClassAssignmentQueryParams,
  ClassItem,
  ClassMemberItem,
  ClassMemberQueryParams,
  ClassQueryParams,
  CreateClassInput,
  UpdateClassInput,
} from '../types';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (params?: ClassQueryParams) => [...classKeys.lists(), params ?? {}] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  membersLists: (classId: string) => [...classKeys.detail(classId), 'members'] as const,
  members: (classId: string, params?: ClassMemberQueryParams) =>
    [...classKeys.membersLists(classId), params ?? {}] as const,
  assignmentsLists: (classId: string) => [...classKeys.detail(classId), 'assignments'] as const,
  assignments: (classId: string, params?: ClassAssignmentQueryParams) =>
    [...classKeys.assignmentsLists(classId), params ?? {}] as const,
};

export const createClassApi = (client = apiClient) => ({
  getClasses: (params?: ClassQueryParams) => client.get<ClassItem[]>('/classes', { params }),
  getClassById: (id: string) => client.get<ClassItem>(`/classes/${id}`),
  createClass: (data: CreateClassInput) => client.post<ClassItem>('/classes', data),
  updateClass: (id: string, data: UpdateClassInput) =>
    client.patch<ClassItem>(`/classes/${id}`, data),
  archiveClass: (id: string) => client.post<ClassItem>(`/classes/${id}/archive`),

  // Members management
  getMembers: (classId: string, params?: ClassMemberQueryParams) =>
    client.get<ClassMemberItem[]>(`/classes/${classId}/members`, { params }),
  addMember: (classId: string, data: AddClassMemberInput) =>
    client.post<ClassMemberItem>(`/classes/${classId}/members`, data),
  removeMember: (classId: string, userId: string) =>
    client.delete<ClassMemberItem>(`/classes/${classId}/members/${userId}`),
  approveMember: (classId: string, userId: string) =>
    client.post<ClassMemberItem>(`/classes/${classId}/members/${userId}/approve`),
  rejectMember: (classId: string, userId: string) =>
    client.post<ClassMemberItem>(`/classes/${classId}/members/${userId}/reject`),

  // Quiz assignments management
  getAssignments: (classId: string, params?: ClassAssignmentQueryParams) =>
    client.get<ClassAssignmentItem[]>(`/classes/${classId}/assignments`, { params }),
  assignQuiz: (classId: string, data: AssignQuizInput) =>
    client.post<ClassAssignmentItem>(`/classes/${classId}/assignments`, data),
  removeAssignment: (classId: string, assignmentId: string) =>
    client.delete<{ success: boolean }>(`/classes/${classId}/assignments/${assignmentId}`),
});

export const classApi = createClassApi();
export const useClassApi = () => createClassApi(useApiClient());
