'use client';

import * as React from 'react';
import { DataTable } from '@/shared/components/data-table';
import { useMyExamHistory } from '../../hooks';
import { createAttemptHistoryColumns } from './attempt-history-columns';

interface AttemptHistoryTableProps {
  onViewScorecard: (attemptId: string) => void;
}

export function AttemptHistoryTable({ onViewScorecard }: AttemptHistoryTableProps) {
  const { data: response, isLoading } = useMyExamHistory();
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
        searchColumnId="status"
        searchPlaceholder="Search attempts by status..."
        emptyMessage="No Examination History"
        emptyDescription="No attempts have been recorded yet in this organization."
      />
    </div>
  );
}
