'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Eye, FileSpreadsheet, Trophy } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { useAssignmentGradebook } from '../../hooks';
import { ExamAttemptStatus } from '../../types';

interface GradebookTableProps {
  assignmentId: string;
  onViewScorecard: (attemptId: string) => void;
}

export function GradebookTable({ assignmentId, onViewScorecard }: GradebookTableProps) {
  const { data: response, isLoading } = useAssignmentGradebook(
    assignmentId,
    undefined,
    Boolean(assignmentId),
  );

  const attempts = response?.data ?? [];

  if (!assignmentId) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-foreground">No Assignment Selected</p>
        <p className="text-xs max-w-sm text-muted-foreground mt-1">
          Please select a classroom and an assignment above to inspect the student gradebook.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
        <Trophy className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-foreground">No Submissions Yet</p>
        <p className="text-xs max-w-sm text-muted-foreground mt-1">
          No students have submitted attempts for this assignment yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40 text-xs">
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Time Spent</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Integrity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-xs divide-y divide-border/60">
          {attempts.map((item) => {
            const percentage =
              item.totalPoints > 0 ? Math.round((item.score / item.totalPoints) * 100) : 0;
            const isPassed = percentage >= 50;
            const violationCount = item.violations?.length ?? 0;

            return (
              <TableRow key={item._id} className="hover:bg-muted/30">
                {/* 1. Student / User ID */}
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  {item.userId.substring(0, 16)}...
                </TableCell>

                {/* 2. Score */}
                <TableCell>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="font-bold text-foreground text-sm">{item.score}</span>
                    <span className="text-[11px] text-muted-foreground">/ {item.totalPoints}</span>
                  </div>
                </TableCell>

                {/* 3. Accuracy % */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-mono',
                      isPassed
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-500',
                    )}
                  >
                    {percentage}% ({item.correctCount} / {item.correctCount + item.wrongCount})
                  </Badge>
                </TableCell>

                {/* 4. Duration */}
                <TableCell className="font-mono text-muted-foreground">
                  {item.durationSec ? formatDuration(item.durationSec) : '0s'}
                </TableCell>

                {/* 5. Submitted At */}
                <TableCell className="text-muted-foreground">
                  {item.submittedAt
                    ? format(new Date(item.submittedAt), 'MMM dd, yyyy HH:mm')
                    : 'In Progress'}
                </TableCell>

                {/* 6. Violations */}
                <TableCell>
                  {violationCount > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-rose-500/30 bg-rose-500/10 text-rose-500 gap-1 text-[10px]"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {violationCount} warning{violationCount > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Clean</span>
                  )}
                </TableCell>

                {/* 7. Status */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] capitalize',
                      item.status === ExamAttemptStatus.SUBMITTED &&
                        'bg-emerald-500/10 text-emerald-500',
                      item.status === ExamAttemptStatus.FORCE_SUBMITTED &&
                        'bg-amber-500/10 text-amber-500',
                    )}
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                </TableCell>

                {/* 8. Action */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onViewScorecard(item._id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Scorecard</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
