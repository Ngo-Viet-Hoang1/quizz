import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/shared/components/layout/dashboard-shell';
import { isAdminRole } from '@/shared/lib/role-utils';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { orgId, orgRole } = await auth.protect();

  if (!orgId) {
    redirect('/onboarding');
  }

  // If user is a Student (org:member) in the active org, redirect to Student Portal
  if (!isAdminRole(orgRole)) {
    redirect('/student');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
