import { ClassMemberRole, ClassMemberStatus, ClassQueryParams, ClassStatus } from './types';

export const DEFAULT_CLASS_PARAMS: ClassQueryParams = {
  page: 1,
  limit: 10,
  status: 'ALL',
};

export const CLASS_STATUS_OPTIONS = [
  { label: 'All Classes', value: 'ALL' },
  { label: 'Active', value: ClassStatus.ACTIVE },
  { label: 'Archived', value: ClassStatus.ARCHIVED },
] as const;

export const MEMBER_ROLE_OPTIONS = [
  { label: 'Student', value: ClassMemberRole.STUDENT },
  { label: 'Assistant', value: ClassMemberRole.ASSISTANT },
] as const;

export const MEMBER_STATUS_OPTIONS = [
  { label: 'Active', value: ClassMemberStatus.ACTIVE },
  { label: 'Pending', value: ClassMemberStatus.PENDING },
  { label: 'Removed', value: ClassMemberStatus.REMOVED },
] as const;
