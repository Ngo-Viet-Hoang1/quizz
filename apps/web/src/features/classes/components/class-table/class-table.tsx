'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { CLASS_STATUS_OPTIONS, DEFAULT_CLASS_PARAMS } from '../../constants';
import { useClassesPaginated } from '../../hooks';
import { ClassItem, ClassQueryParams, ClassStatus } from '../../types';
import { createClassColumns } from './class-columns';

interface ClassTableProps {
  onEdit?: (classItem: ClassItem) => void;
  onArchive?: (classItem: ClassItem) => void;
}

export function ClassTable({ onEdit, onArchive }: ClassTableProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const queryParams: ClassQueryParams = React.useMemo(
    () => ({
      ...DEFAULT_CLASS_PARAMS,
      page,
      limit: pageSize,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(activeFilter !== 'ALL' && { status: activeFilter as ClassStatus }),
      ...(sorting[0] && {
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
      }),
    }),
    [page, pageSize, debouncedSearch, activeFilter, sorting],
  );

  const { data: response, isLoading } = useClassesPaginated(queryParams);

  const classes = response?.data || [];
  const meta = response?.meta;

  const columns = React.useMemo(() => createClassColumns(onEdit, onArchive), [onEdit, onArchive]);

  return (
    <div className="w-full space-y-4">
      <DataTable
        columns={columns}
        data={classes}
        isLoading={isLoading}
        searchColumnId="name"
        searchPlaceholder="Search classes by name..."
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        filterOptions={CLASS_STATUS_OPTIONS}
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
        emptyMessage="No classes found"
        emptyDescription="Get started by creating your first classroom or adjusting your search filters."
      />
    </div>
  );
}
