'use client';

import * as React from 'react';
import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { BookOpen, Clock, Radio, Sparkles } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { DataTableColumnHeader, type DataTableFeatures } from '@/shared/components/data-table';
import { formatDate, formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { QuizItem, QuizSourceType, QuizStatus } from '../../types';
import { QuizRowActions } from './quiz-actions';
import { DifficultyBadge } from '../difficulty-badge';

const columnHelper = createColumnHelper<DataTableFeatures, QuizItem>();

const statusColorMap: Record<string, { className: string; label: string }> = {
  [QuizStatus.PUBLISHED]: {
    label: 'Published',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  [QuizStatus.DRAFT]: {
    label: 'Draft',
    className: 'border-border bg-muted/60 text-muted-foreground',
  },
  [QuizStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
};

export function createQuizColumns(onShare?: (quiz: QuizItem) => void) {
  return columnHelper.columns([
    columnHelper.accessor('title', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="QUIZ NAME" />,
      cell: ({ row }) => {
        const quiz = row.original;
        const isAi = quiz.sourceType !== QuizSourceType.MANUAL;

        return (
          <div className="flex flex-col gap-1 py-1 max-w-sm sm:max-w-md">
            <div className="flex items-center gap-2">
              <Link
                href={`/quizzes/${quiz._id}`}
                className="font-semibold text-foreground tracking-tight hover:text-primary transition-colors line-clamp-1"
              >
                {quiz.title}
              </Link>
              {isAi && (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/30 bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-mono"
                >
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>
            {quiz.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{quiz.description}</p>
            )}
          </div>
        );
      },
    }),

    columnHelper.accessor('category', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CATEGORY" />,
      cell: ({ row }) => {
        const category = row.getValue('category') as string | undefined;
        return (
          <Badge variant="secondary" className="text-xs font-mono">
            {category || 'General'}
          </Badge>
        );
      },
    }),

    columnHelper.accessor('difficulty', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="DIFFICULTY" />,
      cell: ({ row }) => {
        return <DifficultyBadge difficulty={row.original.difficulty} />;
      },
    }),

    columnHelper.accessor('questionCount', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CONTENT & TIME" />,
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {quiz.questionCount || quiz.questions?.length || 0}
            </span>
            {Boolean(quiz.timeLimitSec) && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDuration(quiz.timeLimitSec ?? 0)}
              </span>
            )}
          </div>
        );
      },
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) || 'draft';
        const config = statusColorMap[status] || {
          label: status,
          className: 'border-border bg-muted/60 text-muted-foreground',
        };

        return (
          <Badge variant="outline" className={cn('font-mono text-xs capitalize', config.className)}>
            {config.label}
          </Badge>
        );
      },
    }),

    columnHelper.accessor('activeRoomCount', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="LIVE ROOMS" />,
      cell: ({ row }) => {
        const count = (row.getValue('activeRoomCount') as number) || 0;
        if (count > 0) {
          return (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-500">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              {count} Active
            </span>
          );
        }
        return <span className="font-mono text-xs text-muted-foreground">-</span>;
      },
    }),

    columnHelper.accessor('updatedAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="UPDATED" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(row.getValue('updatedAt'))}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => <QuizRowActions quiz={row.original} onShare={onShare} />,
    }),
  ]);
}
