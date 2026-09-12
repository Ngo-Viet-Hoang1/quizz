import { StudentTopNav } from '@/features/student-portal/components/layout/student-top-nav';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HKT Quizz',
  description: 'Student portal to join classes, take quiz exams, and view results',
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Horizontal Navbar */}
      <StudentTopNav />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Modern Gamified Footer */}
      <footer className="border-t border-border/40 bg-background/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HKT QUIZZ STUDENT PLATFORM • Interactive Learning & Exam Experience</span>
          </div>
          <p>© 2026 VTI RAG Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
