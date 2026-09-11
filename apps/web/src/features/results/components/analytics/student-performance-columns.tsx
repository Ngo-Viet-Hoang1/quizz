'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataTableColumnHeader, DataTableFeatures } from '@/shared/components/data-table';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
import { ExamAttemptItem } from '../../types';

const columnHelper = createColumnHelper<DataTableFeatures, ExamAttemptItem>();

export function createStudentPerformanceColumns(onViewScorecard: (attemptId: string) => void) {
  return columnHelper.columns([
    columnHelper.display({
      id: 'rank',
      header: () => <div className="w-10">RANK</div>,
      cell: ({ row }) => {
        const index = row.index;
        return (
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold',
              index === 0 && 'bg-amber-500/20 text-amber-500',
              index === 1 && 'bg-slate-300/20 text-slate-300',
              index === 2 && 'bg-amber-700/20 text-amber-600',
              index > 2 && 'text-muted-foreground',
            )}
          >
            {index + 1}
          </div>
        );
      },
    }),

    columnHelper.accessor('userId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STUDENT" />,
      cell: ({ row }) => <UserAvatarCell userId={row.original.userId} size="sm" showEmail={true} />,
    }),

    columnHelper.accessor('score', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="SCORE" />,
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-xs text-foreground">
          {row.original.score} / {row.original.totalPoints}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'percentage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="PERCENTAGE" />,
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
            {percentage}%
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
              {violationCount}
            </Badge>
          );
        }
        return <span className="text-[11px] text-muted-foreground">Clean</span>;
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">ACTION</div>,
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
