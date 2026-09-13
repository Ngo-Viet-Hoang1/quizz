'use client';

import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { DataTableColumnHeader, type DataTableFeatures } from '@/shared/components/data-table';
import { formatDate } from '@/shared/lib/date';
import { QuizReportItem } from '../types';
import { ReportReasonBadge, ReportStatusBadge } from './quiz-report-badge';

const columnHelper = createColumnHelper<DataTableFeatures, QuizReportItem>();

export function createQuizReportColumns(onReview?: (reportId: string) => void) {
  return columnHelper.columns([
    columnHelper.accessor('quizTitle', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="QUIZ & VERSION" />,
      cell: ({ row }) => {
        const report = row.original;
        const title = report.quizTitle || `Quiz ${report.quizId.slice(-6)}`;
        return (
          <div className="flex flex-col gap-0.5 py-1 max-w-xs sm:max-w-sm">
            <span className="font-semibold text-foreground tracking-tight line-clamp-1">
              {title}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0 border-border text-muted-foreground"
              >
                v{report.quizVersion}
              </Badge>
            </div>
          </div>
        );
      },
    }),

    columnHelper.accessor('reason', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="REASON" />,
      cell: ({ row }) => {
        return <ReportReasonBadge reason={row.original.reason} />;
      },
    }),

    columnHelper.accessor('description', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STUDENT NOTE" />,
      cell: ({ row }) => {
        const note = row.original.description || row.original.comment;
        return (
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs" title={note}>
            {note || '-'}
          </p>
        );
      },
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
      cell: ({ row }) => {
        return <ReportStatusBadge status={row.original.status} />;
      },
    }),

    columnHelper.accessor('createdAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="REPORTED AT" />,
      cell: ({ row }) => {
        return (
          <span className="text-xs font-mono text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right font-mono text-xs uppercase">ACTION</div>,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => onReview?.(row.original._id)}
            >
              Review
            </Button>
          </div>
        );
      },
    }),
  ]);
}
