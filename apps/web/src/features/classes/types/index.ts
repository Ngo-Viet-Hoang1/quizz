export enum ClassStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum ClassMemberRole {
  STUDENT = 'student',
  ASSISTANT = 'assistant',
}

export enum ClassMemberStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REMOVED = 'removed',
}

export interface ClassItem {
  id?: string;
  _id?: string;
  organizationId: string;
  name: string;
  ownerId: string;
  status: ClassStatus;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  assignmentCount?: number;
}

export interface ClassMemberItem {
  id?: string;
  _id?: string;
  organizationId: string;
  classId: string;
  userId: string;
  role: ClassMemberRole;
  status: ClassMemberStatus;
  joinedAt: string;
}

export interface ClassAssignmentItem {
  id?: string;
  _id?: string;
  organizationId: string;
  quizId: string;
  quizVersion: number;
  classId: string;
  assignedBy: string;
  startAt?: string | null;
  dueAt: string | null;
  allowLateSubmit: boolean;
  createdAt: string;
}

export interface ClassQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClassStatus | string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClassMemberQueryParams {
  page?: number;
  limit?: number;
  role?: ClassMemberRole;
  status?: ClassMemberStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClassAssignmentQueryParams {
  page?: number;
  limit?: number;
  quizId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClassInput {
  name: string;
}

export interface UpdateClassInput {
  name?: string;
  status?: ClassStatus;
}

export interface AddClassMemberInput {
  userId: string;
  role?: ClassMemberRole;
}

export interface AssignQuizInput {
  quizId: string;
  quizVersion?: number;
  startAt?: string;
  dueAt?: string;
  allowLateSubmit?: boolean;
}
