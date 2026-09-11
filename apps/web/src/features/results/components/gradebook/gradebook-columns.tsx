'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataTableColumnHeader, DataTableFeatures } from '@/shared/components/data-table';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
import { ExamAttemptItem, ExamAttemptStatus } from '../../types';

const columnHelper = createColumnHelper<DataTableFeatures, ExamAttemptItem>();

export function createGradebookColumns(onViewScorecard: (attemptId: string) => void) {
  return columnHelper.columns([
    columnHelper.accessor('userId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STUDENT" />,
      cell: ({ row }) => <UserAvatarCell userId={row.original.userId} size="sm" showEmail={true} />,
    }),

    columnHelper.accessor('score', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="SCORE" />,
      cell: ({ row }) => (
        <div className="flex items-baseline gap-1 font-mono">
          <span className="font-bold text-foreground text-sm">{row.original.score}</span>
          <span className="text-[11px] text-muted-foreground">/ {row.original.totalPoints}</span>
        </div>
      ),
    }),

    columnHelper.display({
      id: 'accuracy',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ACCURACY" />,
      cell: ({ row }) => {
        const percentage =
          row.original.totalPoints > 0
            ? Math.round((row.original.score / row.original.totalPoints) * 100)
            : 0;
        const isPassed = percentage >= 50;

        return (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 font-mono',
              isPassed
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-500',
            )}
          >
            {percentage}% ({row.original.correctCount}/
            {row.original.correctCount + row.original.wrongCount})
          </Badge>
        );
      },
    }),

    columnHelper.accessor('durationSec', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="TIME SPENT" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.durationSec ? formatDuration(row.original.durationSec) : '0s'}
        </span>
      ),
    }),

    columnHelper.accessor('submittedAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="SUBMITTED AT" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.submittedAt
            ? format(new Date(row.original.submittedAt), 'MMM dd, yyyy HH:mm')
            : 'In Progress'}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'integrity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="INTEGRITY" />,
      cell: ({ row }) => {
        const violationCount = row.original.violations?.length ?? 0;
        if (violationCount > 0) {
          return (
            <Badge
              variant="outline"
              className="border-rose-500/30 bg-rose-500/10 text-rose-500 gap-1 text-[10px]"
            >
              <AlertTriangle className="h-3 w-3" />
              {violationCount} warning{violationCount > 1 ? 's' : ''}
            </Badge>
          );
        }
        return <span className="text-[11px] text-muted-foreground">Clean</span>;
      },
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px] capitalize',
            row.original.status === ExamAttemptStatus.SUBMITTED &&
              'bg-emerald-500/10 text-emerald-500',
            row.original.status === ExamAttemptStatus.FORCE_SUBMITTED &&
              'bg-amber-500/10 text-amber-500',
          )}
        >
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">ACTIONS</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onViewScorecard(row.original._id)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Scorecard</span>
          </Button>
        </div>
      ),
    }),
  ]);
}
