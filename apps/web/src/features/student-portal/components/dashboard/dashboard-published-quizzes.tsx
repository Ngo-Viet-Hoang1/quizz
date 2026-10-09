'use client';

import type { IPublishedQuiz } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { BookOpen, ChevronRight, Clock, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardPublishedQuizzesProps {
  quizzes: IPublishedQuiz[];
  isLoading: boolean;
  onStartPractice: (quizId: string, title: string) => void;
  isStarting?: boolean;
}

export function DashboardPublishedQuizzes({
  quizzes,
  isLoading,
  onStartPractice,
  isStarting,
}: DashboardPublishedQuizzesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Published Quizzes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore practice quizzes and exam questions published in your organization
          </p>
        </div>
        <Link href="/student/practice">
          <Button
            variant="ghost"
            size="sm"
            className="text-sky-600 dark:text-sky-400 font-semibold gap-1 hover:text-sky-700 text-xs"
          >
            View All <ChevronRight className="size-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
          <BookOpen className="size-10 mx-auto text-muted-foreground/40 mb-2.5" />
          <p className="text-sm font-semibold text-foreground">
            No published quizzes available yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Teachers will publish new examination & practice quizzes here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.slice(0, 3).map((quiz: IPublishedQuiz) => {
            const durationMins = quiz.timeLimitSec ? Math.round(quiz.timeLimitSec / 60) : null;

            return (
              <Card
                key={quiz._id}
                className="rounded-2xl border border-border/70 hover:border-sky-500/40 hover:shadow-sm transition-all overflow-hidden flex flex-col group p-0 bg-card"
              >
                {/* Soft Header Bar */}
                <div className="h-12 bg-slate-50 dark:bg-slate-900/60 border-b border-border/50 px-4 py-2.5 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-card text-muted-foreground border-border text-[11px] font-semibold"
                  >
                    {quiz.category || 'General'}
                  </Badge>

                  {durationMins && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{durationMins} mins</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {quiz.description || 'No description provided for this quiz.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <HelpCircle className="size-3.5 text-sky-500" />
                      <span className="font-medium">{quiz.questionCount ?? 0} Questions</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <Button
                      disabled={isStarting}
                      onClick={() => onStartPractice(quiz._id, quiz.title)}
                      className="w-full h-9 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all"
                    >
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
