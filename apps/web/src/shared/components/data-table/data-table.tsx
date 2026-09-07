'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnVisibilityState,
  RowData,
  RowSelectionState,
  SortingState,
  useTable,
} from '@tanstack/react-table';
import { Inbox } from 'lucide-react';
import { PaginationMeta } from '@repo/shared-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';
import { features, DataTableFeatures, FilterOption } from './data-table-features';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyMessage?: string;
  emptyDescription?: string;
  searchColumnId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  statusFilterColumnId?: string;
  serverPagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  onSortChange?: (sorting: SortingState) => void;
  onRowClick?: (row: TData) => void;
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading = false,
  skeletonRowCount = 5,
  emptyMessage = 'No data found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  searchColumnId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterOptions,
  activeFilter: controlledActiveFilter,
  onFilterChange: controlledOnFilterChange,
  statusFilterColumnId,
  serverPagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  onSortChange,
  onRowClick,
  renderBulkActions,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [internalFilter, setInternalFilter] = React.useState('ALL');

  const currentFilter = controlledActiveFilter ?? internalFilter;
  const handleFilterChange = (val: string) => {
    if (controlledOnFilterChange) {
      controlledOnFilterChange(val);
    } else {
      setInternalFilter(val);
    }
  };

  const handleSortingChange = (updaterOrValue: React.SetStateAction<SortingState>) => {
    const nextSorting =
      typeof updaterOrValue === 'function' ? updaterOrValue(internalSorting) : updaterOrValue;
    setInternalSorting(nextSorting);
    onSortChange?.(nextSorting);
  };

  const table = useTable({
    features,
    data,
    columns,
    rowCount: serverPagination ? serverPagination.total : undefined,
    manualPagination: !!serverPagination,
    manualSorting: !!onSortChange,
    manualFiltering: !!onSearchChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: internalSorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="w-full space-y-4">
      {/* 1. Toolbar Search & Filter */}
      {(searchColumnId || filterOptions) && (
        <DataTableToolbar
          table={table}
          searchColumnId={searchColumnId}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filterOptions={filterOptions}
          activeFilter={currentFilter}
          onFilterChange={handleFilterChange}
          statusFilterColumnId={statusFilterColumnId}
          totalCount={serverPagination?.total}
        />
      )}

      {/* 2. Bulk Actions Bar */}
      {selectedRows.length > 0 && renderBulkActions && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-sm">
          <span className="font-mono text-xs font-medium text-primary">
            {selectedRows.length} item(s) selected
          </span>
          <div className="flex items-center gap-2">{renderBulkActions(selectedRows)}</div>
        </div>
      )}

      {/* 3. Table Container */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-mono text-xs uppercase h-10">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton Loading Rows
              Array.from({ length: skeletonRowCount }).map((_, idx) => (
                <TableRow key={idx} className="h-11">
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-3.5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={`group/row h-11 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/60 border-b border-border/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="font-mono py-1.5">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2 py-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                      <Inbox className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {emptyMessage}
                    </div>
                    <div className="max-w-xs text-xs text-muted-foreground">{emptyDescription}</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Pagination */}
      <DataTablePagination
        table={table}
        serverPagination={serverPagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
