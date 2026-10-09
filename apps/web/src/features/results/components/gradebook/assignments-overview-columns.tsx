'use client';

import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar, FileSpreadsheet, GraduationCap } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DataTableColumnHeader, DataTableFeatures } from '@/shared/components/data-table';
import { ClassAssignmentItem, ClassItem } from '@/features/classes/types';

const columnHelper = createColumnHelper<DataTableFeatures, ClassAssignmentItem>();

interface CreateAssignmentsOverviewColumnsOptions {
  quizMap: Map<string, string>;
  classMap: Map<string, ClassItem>;
  onOpenGradebook: (
    assignment: ClassAssignmentItem,
    quizTitle: string,
    classNameTitle: string,
  ) => void;
}

export function createAssignmentsOverviewColumns({
  quizMap,
  classMap,
  onOpenGradebook,
}: CreateAssignmentsOverviewColumnsOptions) {
  return columnHelper.columns([
    columnHelper.accessor('quizId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="QUIZ ASSESSMENT" />,
      cell: ({ row }) => {
        const quizTitle = quizMap.get(row.original.quizId) || 'Quiz Assessment';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xs">{quizTitle}</span>
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                v{row.original.quizVersion}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-normal">
              Assigned: {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        );
      },
    }),

    columnHelper.accessor('classId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CLASSROOM" />,
      cell: ({ row }) => {
        const cls = classMap.get(row.original.classId);
        const classNameTitle = cls?.name || 'Classroom';
        return (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-xs text-foreground">{classNameTitle}</span>
            {cls?.memberCount ? (
              <span className="text-muted-foreground font-mono text-[11px]">
                ({cls.memberCount} students)
              </span>
            ) : null}
          </div>
        );
      },
    }),

    columnHelper.display({
      id: 'schedule',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SCHEDULE & DEADLINE" />,
      cell: ({ row }) => {
        const isPractice = !row.original.startAt && !row.original.dueAt;
        if (isPractice) {
          return (
            <Badge variant="secondary" className="text-[10px]">
              Open Practice / Untimed
            </Badge>
          );
        }
        return (
          <div className="space-y-0.5 text-muted-foreground font-mono text-[11px]">
            {row.original.dueAt ? (
              <div className="flex items-center gap-1 text-foreground font-medium">
                <Calendar className="h-3 w-3 text-primary" />
                <span>Due: {format(new Date(row.original.dueAt), 'MMM dd, HH:mm')}</span>
              </div>
            ) : null}
            {row.original.startAt ? (
              <p>Starts: {format(new Date(row.original.startAt), 'MMM dd, HH:mm')}</p>
            ) : null}
          </div>
        );
      },
    }),

    columnHelper.accessor('allowLateSubmit', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="LATE SUBMISSION" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.allowLateSubmit
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px]'
              : 'border-border text-muted-foreground text-[10px]'
          }
        >
          {row.original.allowLateSubmit ? 'Allowed' : 'Disabled'}
        </Badge>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">ACTIONS</div>,
      cell: ({ row }) => {
        const quizTitle = quizMap.get(row.original.quizId) || 'Quiz Assessment';
        const cls = classMap.get(row.original.classId);
        const classNameTitle = cls?.name || 'Classroom';
        return (
          <div className="text-right">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 font-medium px-2.5"
              onClick={() => onOpenGradebook(row.original, quizTitle, classNameTitle)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              <span>View Gradebook</span>
            </Button>
          </div>
        );
      },
    }),
  ]);
}
