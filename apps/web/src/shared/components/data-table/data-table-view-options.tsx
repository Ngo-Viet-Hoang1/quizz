'use client';

import { ReactTable, RowData } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { DataTableFeatures } from './data-table-features';

export function DataTableViewOptions<TData extends RowData>({
  table,
}: {
  table: ReactTable<DataTableFeatures, TData>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-9 rounded-xl font-mono text-xs lg:flex"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            View
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-37.5">
        <DropdownMenuLabel className="font-mono text-xs">Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize font-mono text-xs"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
