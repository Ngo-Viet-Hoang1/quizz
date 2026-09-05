'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { DataTable, FilterOption } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import {
  DEFAULT_QUIZ_PARAMS,
  useQuizzes,
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

  // Build params with only defined values so the initial state matches the SSR prefetch cache key
  const queryParams: QuizQueryParams = {
    ...DEFAULT_QUIZ_PARAMS,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(activeFilter !== 'ALL' && { status: activeFilter as QuizStatus }),
    ...(sorting[0] && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
    }),
  };

  const { data: quizzes = [], isLoading } = useQuizzes(queryParams);

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
        onSearchChange={(val) => setSearchInput(val)}
        filterOptions={statusFilterOptions}
        activeFilter={activeFilter}
        onFilterChange={(val) => setActiveFilter(val)}
        onSortChange={setSorting}
        emptyMessage="No quizzes found"
        emptyDescription="Get started by creating your first quiz or adjusting your search filters."
      />
    </div>
  );
}
