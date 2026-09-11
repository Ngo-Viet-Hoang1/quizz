'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { classKeys, useClassApi } from '../api';
import {
  ClassAssignmentItem,
  ClassAssignmentQueryParams,
  ClassItem,
  ClassMemberItem,
  ClassMemberQueryParams,
  ClassQueryParams,
} from '../types';

export function useClasses(params?: ClassQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useClassApi();

  return useQuery<ClassItem[]>({
    queryKey: classKeys.list(params),
    queryFn: () => api.getClasses(params),
    enabled: isLoaded && Boolean(orgId),
  });
}

export function useClass(id: string, initialData?: ClassItem) {
  const { isLoaded, orgId } = useAuth();
  const api = useClassApi();

  return useQuery<ClassItem>({
    queryKey: classKeys.detail(id),
    queryFn: () => api.getClassById(id),
    enabled: isLoaded && Boolean(orgId) && Boolean(id),
    initialData,
  });
}

export function useClassMembers(classId: string, params?: ClassMemberQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useClassApi();

  return useQuery<ClassMemberItem[]>({
    queryKey: classKeys.members(classId, params),
    queryFn: () => api.getMembers(classId, params),
    enabled: isLoaded && Boolean(orgId) && Boolean(classId),
  });
}

export function useClassAssignments(classId: string, params?: ClassAssignmentQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useClassApi();

  return useQuery<ClassAssignmentItem[]>({
    queryKey: classKeys.assignments(classId, params),
    queryFn: () => api.getAssignments(classId, params),
    enabled: isLoaded && Boolean(orgId) && Boolean(classId),
  });
}
