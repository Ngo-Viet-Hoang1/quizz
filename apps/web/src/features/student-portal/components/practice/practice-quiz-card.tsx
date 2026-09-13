'use client';

import type { IPublishedQuiz } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Clock, Layers } from 'lucide-react';

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

function formatTimeLimit(sec?: number): string {
  if (!sec) return 'No limit';
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)} min`;
}

interface PracticeQuizCardProps {
  quiz: IPublishedQuiz;
  isStarting: boolean;
  onStart: (quizId: string, title: string) => void;
}

export function PracticeQuizCard({ quiz, isStarting, onStart }: PracticeQuizCardProps) {
  return (
    <Card className="rounded-2xl border border-border/70 hover:border-sky-500/40 hover:shadow-sm transition-all overflow-hidden flex flex-col group p-0 bg-card">
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Quiz Info */}
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
              {quiz.title}
            </h3>
          </div>

          {quiz.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {quiz.description}
            </p>
          )}

          {/* Metadata Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {quiz.category && (
              <Badge
                variant="outline"
                className="text-[11px] font-semibold bg-muted/50 border-border text-muted-foreground"
              >
                {quiz.category}
              </Badge>
            )}
            <Badge
              className={`text-[11px] font-semibold capitalize ${DIFFICULTY_STYLES[quiz.difficulty] || DIFFICULTY_STYLES.medium}`}
            >
              {quiz.difficulty}
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium pt-2 border-t border-border/50">
          <span className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-sky-600" />
            {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
          </span>
          {Boolean(quiz.timeLimitSec) && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-600" />
              {formatTimeLimit(quiz.timeLimitSec)}
            </span>
          )}
        </div>

        {/* Start Practice Button */}
        <Button
          onClick={() => onStart(quiz._id, quiz.title)}
          disabled={isStarting}
          className="w-full h-9 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all"
        >
          {isStarting ? 'Starting...' : 'Start Practice'}
        </Button>
      </CardContent>
    </Card>
  );
}
