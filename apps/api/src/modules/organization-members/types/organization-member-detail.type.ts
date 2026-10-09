export interface OrganizationMemberDetail {
  _id: string;
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  status: 'active' | 'removed';
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}
