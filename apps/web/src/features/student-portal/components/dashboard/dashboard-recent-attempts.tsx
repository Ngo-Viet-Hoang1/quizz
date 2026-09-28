'use client';

import type { IExamAttempt } from '@/features/student-portal/types';
import { calculateScorePercentage, isExamPassed } from '@/features/student-portal/utils/exam.utils';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { BookOpenCheck, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface DashboardRecentAttemptsProps {
  recentAttempts: IExamAttempt[];
}

export function DashboardRecentAttempts({ recentAttempts }: DashboardRecentAttemptsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Exam Results</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your progress and review detailed explanations
          </p>
        </div>
        <Link href="/student/history">
          <Button
            variant="ghost"
            size="sm"
            className="text-sky-600 dark:text-sky-400 font-semibold gap-1 hover:text-sky-700 text-xs"
          >
            Full History <ChevronRight className="size-4" />
          </Button>
        </Link>
      </div>

      {recentAttempts.length === 0 ? (
        <Card className="rounded-2xl border p-8 text-center text-muted-foreground">
          <BookOpenCheck className="size-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm font-semibold">No exam attempts completed yet</p>
        </Card>
      ) : (
        <Card className="rounded-2xl border p-0 overflow-hidden bg-card/60 backdrop-blur-sm shadow-xs">
          <div className="divide-y divide-border/60">
            {recentAttempts.map((attempt: IExamAttempt) => {
              const pct = calculateScorePercentage(attempt.score, attempt.totalPoints);
              const isPassed = isExamPassed(attempt.score, attempt.totalPoints);

              const quizTitle =
                typeof attempt.quizId === 'object' && attempt.quizId?.title
                  ? attempt.quizId.title
                  : attempt.quizTitle ||
                    `Quiz #${(typeof attempt.quizId === 'string' ? attempt.quizId : (attempt.quizId?._id ?? '')).slice(-6)}`;

              return (
                <div
                  key={attempt._id}
                  className="p-3.5 sm:px-5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl shrink-0 font-extrabold text-xs',
                        isPassed
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-red-500/15 text-red-600',
                      )}
                    >
                      {pct}%
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                        {quizTitle}
                      </h4>
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />{' '}
                          {attempt.correctCount} correct
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />{' '}
                          {attempt.submittedAt
                            ? new Date(attempt.submittedAt).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/student/exam/${attempt._id}/result`} className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold text-xs h-8 px-3 gap-1.5"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
