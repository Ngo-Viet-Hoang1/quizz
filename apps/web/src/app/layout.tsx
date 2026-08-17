import type { Metadata } from 'next';
import { QueryProvider } from '@/shared/lib/query-provider';
import { QuizProvider } from '@/shared/lib/quiz-context';
import { Navbar } from '@/shared/ui/navbar';
import { Sidebar } from '@/shared/ui/sidebar';
import { Modals } from '@/shared/ui/modals';
import { ExamPlayer } from '@/shared/ui/exam-player';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quizizz Pro — Monorepo Enterprise Platform',
  description: 'Trắc nghiệm trực tuyến thế hệ mới với AI Quiz Generator, Live Room & Analytics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col antialiased">
        <QueryProvider>
          <QuizProvider>
            <Navbar />
            <div className="flex-1 flex max-w-7xl w-full mx-auto">
              <Sidebar />
              <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">{children}</main>
            </div>
            <Modals />
            <ExamPlayer />
          </QuizProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
