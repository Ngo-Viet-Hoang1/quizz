'use client';

import { Clock } from 'lucide-react';

interface ExamHeaderProps {
  timeLeft: number | null;
  isTimeLow: boolean;
  formatTime: (seconds: number) => string;
}

export function ExamHeader({ timeLeft, isTimeLow, formatTime }: ExamHeaderProps) {
  return (
    <header className="sticky top-14 z-20 bg-background/95 backdrop-blur-md border-b -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 font-mono text-base sm:text-lg font-bold px-3 py-1.5 rounded-xl border transition-colors ${
              isTimeLow
                ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900 animate-pulse'
                : 'text-foreground bg-muted/40 border-border/60'
            }`}
          >
            <Clock className="size-4 sm:size-5 text-indigo-600 dark:text-indigo-400" />
            <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--:--'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
