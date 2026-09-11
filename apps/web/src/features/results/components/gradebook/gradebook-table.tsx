'use client';

import * as React from 'react';
import { DataTable } from '@/shared/components/data-table';
import { useAssignmentGradebook } from '../../hooks';
import { createGradebookColumns } from './gradebook-columns';

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

  const columns = React.useMemo(() => createGradebookColumns(onViewScorecard), [onViewScorecard]);

  return (
    <div className="w-full space-y-4">
      <DataTable
        columns={columns}
        data={attempts}
        isLoading={isLoading}
        searchColumnId="userId"
        searchPlaceholder="Search student submissions..."
        emptyMessage="No Submissions Yet"
        emptyDescription="No students have submitted attempts for this assignment yet."
      />
    </div>
  );
}
