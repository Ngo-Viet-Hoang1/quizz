import { FilterOption } from '@/shared/components/data-table';
import { ClassMemberRole, ClassMemberStatus, ClassQueryParams, ClassStatus } from './types';

export const DEFAULT_CLASS_PARAMS: ClassQueryParams = {
  page: 1,
  limit: 10,
};

export const CLASS_STATUS_OPTIONS: FilterOption[] = [
  { label: 'All Classes', value: 'ALL' },
  { label: 'Active', value: ClassStatus.ACTIVE },
  { label: 'Archived', value: ClassStatus.ARCHIVED },
];

export const MEMBER_ROLE_OPTIONS = [
  { label: 'Student', value: ClassMemberRole.STUDENT },
  { label: 'Assistant', value: ClassMemberRole.ASSISTANT },
] as const;

export const MEMBER_STATUS_OPTIONS = [
  { label: 'Active', value: ClassMemberStatus.ACTIVE },
  { label: 'Pending', value: ClassMemberStatus.PENDING },
  { label: 'Removed', value: ClassMemberStatus.REMOVED },
] as const;
