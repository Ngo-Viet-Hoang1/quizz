'use client';

import { ReactTable, RowData } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DataTableFeatures } from './data-table-features';

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  serverPagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit?: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData extends RowData>({
  table,
  serverPagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 30, 50],
}: DataTablePaginationProps<TData>) {
  const currentPage = serverPagination
    ? serverPagination.page
    : table.state.pagination.pageIndex + 1;
  const totalPages = serverPagination ? serverPagination.totalPages : table.getPageCount();
  const currentLimit = serverPagination?.limit ?? table.state.pagination.pageSize;

  const canPrev = serverPagination ? currentPage > 1 : table.getCanPreviousPage();
  const canNext = serverPagination ? currentPage < totalPages : table.getCanNextPage();

  const handlePageSizeChange = (newSize: number) => {
    if (!serverPagination) {
      table.setPageSize(newSize);
    }
    onPageSizeChange?.(newSize);
  };

  return (
    <div className="flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Rows per page selector */}
      <div className="flex items-center space-x-2">
        <p className="text-xs font-mono font-medium text-muted-foreground">Rows per page:</p>
        <Select
          value={String(currentLimit)}
          onValueChange={(val) => {
            if (val) handlePageSizeChange(Number(val));
          }}
        >
          <SelectTrigger size="sm" className="h-8 min-w-17 font-mono text-xs">
            <SelectValue>{String(currentLimit)}</SelectValue>
          </SelectTrigger>
          <SelectContent side="top" className="min-w-17 font-mono text-xs">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground">
          PAGE {currentPage} OF {Math.max(totalPages, 1)}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            onClick={() => {
              if (onPageChange && serverPagination) {
                onPageChange(1);
              } else {
                table.setPageIndex(0);
              }
            }}
            disabled={!canPrev}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1"
            onClick={() => {
              if (onPageChange && serverPagination) {
                onPageChange(currentPage - 1);
              } else {
                table.previousPage();
              }
            }}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1"
            onClick={() => {
              if (onPageChange && serverPagination) {
                onPageChange(currentPage + 1);
              } else {
                table.nextPage();
              }
            }}
            disabled={!canNext}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            onClick={() => {
              if (onPageChange && serverPagination) {
                onPageChange(totalPages);
              } else {
                table.setPageIndex(table.getPageCount() - 1);
              }
            }}
            disabled={!canNext}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
