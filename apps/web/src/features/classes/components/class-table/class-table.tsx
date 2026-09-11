'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { CLASS_STATUS_OPTIONS, DEFAULT_CLASS_PARAMS } from '../../constants';
import { useClasses } from '../../hooks';
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

  const queryParams: ClassQueryParams = {
    ...DEFAULT_CLASS_PARAMS,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(activeFilter !== 'ALL' && { status: activeFilter as ClassStatus }),
    ...(sorting[0] && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
    }),
  };

  const { data: classes = [], isLoading } = useClasses(queryParams);

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
        onSearchChange={(val) => setSearchInput(val)}
        filterOptions={CLASS_STATUS_OPTIONS}
        activeFilter={activeFilter}
        onFilterChange={(val) => setActiveFilter(val)}
        onSortChange={setSorting}
        emptyMessage="No classes found"
        emptyDescription="Get started by creating your first classroom or adjusting your search filters."
      />
    </div>
  );
}
