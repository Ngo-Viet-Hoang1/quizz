import { PERMISSIONS } from '@repo/shared-types';

export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  'org:admin': [
    PERMISSIONS.QUIZ_MANAGE,
    PERMISSIONS.QUIZ_MODERATE,
    PERMISSIONS.ROOM_HOST,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  'org:teacher': [PERMISSIONS.QUIZ_MANAGE, PERMISSIONS.ROOM_HOST, PERMISSIONS.ANALYTICS_VIEW],
  'org:member': [],
};

export function resolvePermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS_MAP[role] ?? [];
}
