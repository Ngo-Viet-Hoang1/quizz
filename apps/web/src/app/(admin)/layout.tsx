import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/shared/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth.protect();

  if (!orgId) {
    redirect('/onboarding');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
