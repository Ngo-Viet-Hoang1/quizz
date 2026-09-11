'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/shared/ui/badge';
import { DataTableColumnHeader, DataTableFeatures } from '@/shared/components/data-table';
import { cn } from '@/shared/lib/utils';

export interface ClassPerformanceRow {
  classId: string;
  className: string;
  totalStudents: number;
  totalAttempts: number;
  avgScore: number;
  avgPercentage: number;
  passRate: number;
  violationsCount: number;
}

const columnHelper = createColumnHelper<DataTableFeatures, ClassPerformanceRow>();

export function createClassroomPerformanceColumns() {
  return columnHelper.columns([
    columnHelper.accessor('className', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CLASSROOM NAME" />,
      cell: ({ row }) => (
        <span className="font-medium text-xs text-foreground">{row.original.className}</span>
      ),
    }),

    columnHelper.accessor('totalStudents', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STUDENTS" />,
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-muted-foreground">
          {row.original.totalStudents}
        </div>
      ),
    }),

    columnHelper.accessor('totalAttempts', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="SUBMISSIONS" />,
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-foreground font-medium">
          {row.original.totalAttempts}
        </div>
      ),
    }),

    columnHelper.display({
      id: 'avgScore',
      header: ({ column }) => <DataTableColumnHeader column={column} title="AVERAGE SCORE" />,
      cell: ({ row }) => {
        if (row.original.totalAttempts === 0) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="font-bold text-foreground text-xs">{row.original.avgPercentage}%</span>
            <span className="text-[11px] text-muted-foreground">({row.original.avgScore} pts)</span>
          </div>
        );
      },
    }),

    columnHelper.accessor('passRate', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="PASS RATE" />,
      cell: ({ row }) => {
        if (row.original.totalAttempts === 0) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        const isHighPass = row.original.passRate >= 70;
        return (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 font-mono',
              isHighPass
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-500',
            )}
          >
            {row.original.passRate}%
          </Badge>
        );
      },
    }),

    columnHelper.accessor('violationsCount', {
      header: () => <div className="text-right">INTEGRITY</div>,
      cell: ({ row }) => {
        if (row.original.violationsCount > 0) {
          return (
            <div className="text-right">
              <span className="text-[11px] text-rose-500 font-medium">
                {row.original.violationsCount} alert{row.original.violationsCount > 1 ? 's' : ''}
              </span>
            </div>
          );
        }
        return (
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">Clean</span>
          </div>
        );
      },
    }),
  ]);
}
