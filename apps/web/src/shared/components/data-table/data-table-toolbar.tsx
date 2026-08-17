import { ReactTable, RowData } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFeatures, FilterOption } from './data-table-features';

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  searchColumnId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  statusFilterColumnId?: string;
  totalCount?: number;
}

export function DataTableToolbar<TData extends RowData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterOptions,
  activeFilter = 'ALL',
  onFilterChange,
  statusFilterColumnId,
  totalCount,
}: DataTableToolbarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = totalCount ?? table.getFilteredRowModel().rows.length;

  const currentSearchValue =
    searchValue !== undefined
      ? searchValue
      : searchColumnId
        ? ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? '')
        : '';

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else if (searchColumnId) {
      table.getColumn(searchColumnId)?.setFilterValue(val);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Row 1: Search bar + Filter Pills + View Options */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {searchColumnId && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={currentSearchValue}
              onChange={handleSearchChange}
              className="h-10 rounded-xl bg-card pl-10 text-sm font-mono placeholder:text-muted-foreground/70"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Filter Pills (e.g. ALL, ACTIVE, INACTIVE) */}
          {filterOptions && filterOptions.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border bg-card p-1">
              {filterOptions.map((opt) => {
                const isActive = activeFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onFilterChange?.(opt.value);
                      if (statusFilterColumnId) {
                        table
                          .getColumn(statusFilterColumnId)
                          ?.setFilterValue(opt.value === 'ALL' ? undefined : opt.value);
                      }
                    }}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-mono font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                    {opt.count !== undefined && (
                      <span className="ml-1.5 opacity-70">({opt.count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Row 2: Selection Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
              className="h-7 px-2 text-xs font-mono hover:text-destructive"
            >
              CLEAR SELECTION
            </Button>
          )}
        </div>
        <div>
          {totalRows} ROWS · {selectedCount} SELECTED
        </div>
      </div>
    </div>
  );
}
