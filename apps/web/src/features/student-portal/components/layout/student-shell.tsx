'use client';

import type { ReactNode } from 'react';
import { StudentHeader } from './student-header';
import { StudentSidebar } from './student-sidebar';

export function StudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 md:w-60 overflow-hidden">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 md:pl-60">
        <StudentHeader />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
