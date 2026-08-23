'use client';

import { cn } from '@/shared/lib/utils';
import { useUIStore } from '@/shared/stores/ui-store';
import type { ReactNode } from 'react';
import { DashboardHeader } from './dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Persistent Sidebar Container (Snappy 150ms transition) */}
      <div
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 transition-[width] duration-150 ease-in-out overflow-hidden',
          sidebarOpen ? 'md:w-64' : 'md:w-16',
        )}
      >
        <DashboardSidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-[padding-left] duration-150 ease-in-out',
          sidebarOpen ? 'md:pl-64' : 'md:pl-16',
        )}
      >
        <DashboardHeader />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
