'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { ExamAttemptItem, ExamAttemptStatus } from '../../types';

const statusConfigMap: Record<ExamAttemptStatus, { label: string; className: string }> = {
  [ExamAttemptStatus.SUBMITTED]: {
    label: 'Submitted',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  [ExamAttemptStatus.FORCE_SUBMITTED]: {
    label: 'Force Submitted',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
  [ExamAttemptStatus.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
  },
  [ExamAttemptStatus.ABANDONED]: {
    label: 'Abandoned',
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
  },
};

interface ScorecardSummaryCardProps {
  attempt: ExamAttemptItem;
}

export function ScorecardSummaryCard({ attempt }: ScorecardSummaryCardProps) {
  const percentage =
    attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;

  const isPassed = percentage >= 50;
  const statusConfig = statusConfigMap[attempt.status] || {
    label: attempt.status,
    className: 'border-border bg-muted/60 text-muted-foreground',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Final Score */}
      <Card className="p-3.5 space-y-1.5 bg-card/60 border border-border/80 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Score
          </span>
          <Trophy
            className={cn(
              'h-4 w-4 shrink-0',
              isPassed ? 'text-amber-500' : 'text-muted-foreground',
            )}
          />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-foreground">{attempt.score}</span>
          <span className="text-xs text-muted-foreground font-mono">
            / {attempt.totalPoints} pts
          </span>
        </div>
        <div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 font-medium',
              isPassed
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-500',
            )}
          >
            {percentage}% {isPassed ? 'Passed' : 'Needs Review'}
          </Badge>
        </div>
      </Card>

      {/* 2. Questions Accuracy */}
      <Card className="p-3.5 space-y-1.5 bg-card/60 border border-border/80 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Accuracy
          </span>
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-foreground">
            {attempt.correctCount} / {attempt.correctCount + attempt.wrongCount}
          </span>
          <span className="text-xs text-muted-foreground font-mono">correct</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-emerald-500 font-medium">{attempt.correctCount} right</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-rose-500 font-medium">{attempt.wrongCount} wrong</span>
        </div>
      </Card>

      {/* 3. Duration & Time */}
      <Card className="p-3.5 space-y-1.5 bg-card/60 border border-border/80 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Duration
          </span>
          <Clock className="h-4 w-4 text-primary shrink-0" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-foreground">
            {attempt.durationSec ? formatDuration(attempt.durationSec) : '0s'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {attempt.submittedAt
            ? format(new Date(attempt.submittedAt), 'MMM dd, HH:mm')
            : 'In progress'}
        </p>
      </Card>

      {/* 4. Status & Violations */}
      <Card className="p-3.5 space-y-1.5 bg-card/60 border border-border/80 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Status
          </span>
          {attempt.violations?.length > 0 && (
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse shrink-0" />
          )}
        </div>
        <div>
          <Badge variant="outline" className={cn('text-xs capitalize', statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>
        {attempt.violations?.length > 0 ? (
          <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 truncate">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>
              {attempt.violations.length}{' '}
              {attempt.violations.length === 1 ? 'violation' : 'violations'}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground truncate">0 integrity alerts</p>
        )}
      </Card>
    </div>
  );
}
