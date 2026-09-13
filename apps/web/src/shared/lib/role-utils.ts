/**
 * Role Utility Helpers for Clerk Organization Roles
 * Admin / Teacher: 'org:admin' | 'org:teacher'
 * Student: 'org:member' | default
 */

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized === 'org:admin' ||
    normalized === 'org:teacher' ||
    normalized === 'admin' ||
    normalized === 'teacher'
  );
}

export function isStudentRole(role?: string | null): boolean {
  return !isAdminRole(role);
}

export function getRoleLabel(role?: string | null): 'Admin / Teacher' | 'Student' {
  return isAdminRole(role) ? 'Admin / Teacher' : 'Student';
}

export function getDefaultPortalPath(role?: string | null): '/dashboard' | '/student' {
  return isAdminRole(role) ? '/dashboard' : '/student';
}
