import { auth } from '@clerk/nextjs/server';
import { DashboardShell } from '@/shared/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();

  return <DashboardShell>{children}</DashboardShell>;
}
