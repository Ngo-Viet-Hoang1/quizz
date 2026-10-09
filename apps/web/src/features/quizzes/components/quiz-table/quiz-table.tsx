'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { DataTable, FilterOption } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import {
  DEFAULT_QUIZ_PARAMS,
  useQuizzesPaginated,
  QuizItem,
  QuizQueryParams,
  QuizStatus,
} from '@/features/quizzes';
import { createQuizColumns } from './quiz-columns';

const statusFilterOptions: FilterOption[] = [
  { label: 'All Quizzes', value: 'ALL' },
  { label: 'Published', value: QuizStatus.PUBLISHED },
  { label: 'Draft', value: QuizStatus.DRAFT },
  { label: 'Archived', value: QuizStatus.ARCHIVED },
];

interface QuizTableProps {
  onShareQuiz?: (quiz: QuizItem) => void;
}

export function QuizTable({ onShareQuiz }: QuizTableProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Build params with only defined values so the initial state matches the SSR prefetch cache key
  const queryParams: QuizQueryParams = React.useMemo(
    () => ({
      ...DEFAULT_QUIZ_PARAMS,
      page,
      limit: pageSize,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(activeFilter !== 'ALL' && { status: activeFilter as QuizStatus }),
      ...(sorting[0] && {
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
      }),
    }),
    [page, pageSize, debouncedSearch, activeFilter, sorting],
  );

  const { data: response, isLoading } = useQuizzesPaginated(queryParams);

  const quizzes = response?.data || [];
  const meta = response?.meta;

  const columns = React.useMemo(() => createQuizColumns(onShareQuiz), [onShareQuiz]);

  return (
    <div className="w-full space-y-4">
      <DataTable
        columns={columns}
        data={quizzes}
        isLoading={isLoading}
        searchColumnId="title"
        searchPlaceholder="Search quizzes by title or category..."
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
        emptyMessage="No quizzes found"
        emptyDescription="Get started by creating your first quiz or adjusting your search filters."
      />
    </div>
  );
}
