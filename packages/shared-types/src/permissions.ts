export const PERMISSIONS = {
  /** Create/Edit/Delete own quizzes */
  QUIZ_MANAGE: 'org:quiz:manage',
  /** Edit/Delete any quiz in the org (admin/moderator) */
  QUIZ_MODERATE: 'org:quiz:moderate',
  /** Create and control quiz room */
  ROOM_HOST: 'org:room:host',
  /** Invite/kick/change member's role in org */
  MEMBER_MANAGE: 'org:member:manage',
  /** View org's analytics and reports*/
  ANALYTICS_VIEW: 'org:analytics:view',
  /** Manage org, plan settings */
  SETTINGS_MANAGE: 'org:settings:manage',
} as const satisfies Record<string, string>;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
