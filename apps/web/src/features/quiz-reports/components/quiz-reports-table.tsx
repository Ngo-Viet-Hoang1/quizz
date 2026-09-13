'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { DataTable, FilterOption } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { useQuizReports } from '../hooks';
import { createQuizReportColumns } from './quiz-reports-columns';
import { QuizReportDetailDialog } from './quiz-report-detail-dialog';
import { QueryQuizReportsParams, QuizReportItem, ReportStatus } from '../types';

const statusFilterOptions: FilterOption[] = [
  { label: 'All Reports', value: 'ALL' },
  { label: 'Pending', value: ReportStatus.PENDING },
  { label: 'Resolved', value: ReportStatus.RESOLVED },
  { label: 'Rejected', value: ReportStatus.REJECTED },
];

export function QuizReportsTable() {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const queryParams: QueryQuizReportsParams = React.useMemo(() => {
    return {
      page,
      limit: pageSize,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(activeFilter !== 'ALL' && { status: activeFilter as ReportStatus }),
      ...(sorting[0] && {
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
      }),
    };
  }, [page, pageSize, debouncedSearch, activeFilter, sorting]);

  const { data, isLoading } = useQuizReports(queryParams);

  const handleOpenDetail = (id: string) => {
    setSelectedReportId(id);
    setIsDialogOpen(true);
  };

  const columns = React.useMemo(() => createQuizReportColumns(handleOpenDetail), []);

  const rawData = data as unknown as { items?: QuizReportItem[]; data?: QuizReportItem[] };
  const reports: QuizReportItem[] = rawData?.items ?? rawData?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="w-full space-y-4">
      <DataTable
        columns={columns}
        data={reports}
        isLoading={isLoading}
        searchColumnId="quizTitle"
        searchPlaceholder="Search reports by quiz name, student name, or notes..."
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        filterOptions={statusFilterOptions}
        activeFilter={activeFilter}
        onFilterChange={(val) => {
          setActiveFilter(val);
          setPage(1);
        }}
        serverPagination={meta}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onSortChange={setSorting}
        onRowClick={(row) => handleOpenDetail(row._id)}
        emptyMessage="No quiz reports found"
        emptyDescription="There are no question discrepancy reports matching your current filter criteria."
      />

      {/* 1-Click Detail & Resolution Dialog */}
      <QuizReportDetailDialog
        reportId={selectedReportId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
