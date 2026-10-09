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
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const { data: response, isLoading } = useAssignmentGradebook(
    assignmentId,
    { page, limit: pageSize },
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
        page={page}
        pageSize={pageSize}
        serverPagination={response?.meta}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchColumnId="userId"
        searchPlaceholder="Search student submissions..."
        emptyMessage="No Submissions Yet"
        emptyDescription="No students have submitted attempts for this assignment yet."
      />
    </div>
  );
}
