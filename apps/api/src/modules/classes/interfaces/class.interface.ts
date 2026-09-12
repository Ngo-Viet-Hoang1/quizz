import { ClassMemberRole, ClassMemberStatus, ClassStatus } from '../enums/class.enum';

export interface IClass {
  id: string;
  organizationId: string;
  name: string;
  ownerId: string;
  status: ClassStatus;
  membershipStatus?: ClassMemberStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClassMember {
  id: string;
  organizationId: string;
  classId: string;
  userId: string;
  role: ClassMemberRole;
  status: ClassMemberStatus;
  joinedAt: Date;
}

export interface IQuizAssignment {
  id: string;
  organizationId: string;
  quizId: string;
  quizVersion: number;
  classId: string;
  assignedBy: string;
  startAt?: Date | null;
  dueAt: Date | null;
  allowLateSubmit: boolean;
  createdAt: Date;
}
