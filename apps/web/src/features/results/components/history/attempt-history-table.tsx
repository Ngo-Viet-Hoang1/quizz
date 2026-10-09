'use client';

import * as React from 'react';
import { DataTable } from '@/shared/components/data-table';
import { useMyExamHistory } from '../../hooks';
import { createAttemptHistoryColumns } from './attempt-history-columns';

interface AttemptHistoryTableProps {
  onViewScorecard: (attemptId: string) => void;
}

export function AttemptHistoryTable({ onViewScorecard }: AttemptHistoryTableProps) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const { data: response, isLoading } = useMyExamHistory({ page, limit: pageSize });
  const attempts = response?.data ?? [];

  const columns = React.useMemo(
    () => createAttemptHistoryColumns(onViewScorecard),
    [onViewScorecard],
  );

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
        searchColumnId="status"
        searchPlaceholder="Search attempts by status..."
        emptyMessage="No Examination History"
        emptyDescription="No attempts have been recorded yet in this organization."
      />
    </div>
  );
}
