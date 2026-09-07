'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { DataTableColumnHeader } from '@/shared/components/data-table';
import { DataTableFeatures } from '@/shared/components/data-table/data-table-features';
import { AuditLogItem } from '../types';
import { CopyableIdentifier, MethodBadge, ResourceBadge, StatusBadge } from './audit-ui-helpers';

export function createAuditColumns(
  onViewDetails: (log: AuditLogItem) => void,
): ColumnDef<DataTableFeatures, AuditLogItem>[] {
  return [
    // 1. Selection Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center w-5">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // 2. Timestamp (Left-aligned text with subtle color)
    {
      id: 'timestamp',
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
          <div className="flex items-center gap-2 whitespace-nowrap text-xs font-mono">
            <span className="font-semibold text-foreground">
              {date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-muted-foreground/80 text-[11px]">
              {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // 3. Action / Event Name (Left-aligned with primary color accent)
    {
      id: 'action',
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Event / Action" />,
      cell: ({ row }) => {
        const action = row.original.action;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap truncate max-w-[200px]">
            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded truncate">
              {action}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // 4. Resource & ID (Left-aligned, Truncate never wrap with ResourceBadge)
    {
      id: 'resource',
      header: 'Target Resource',
      cell: ({ row }) => {
        const type = row.original.resourceType;
        const id = row.original.resourceId;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap truncate max-w-[220px]">
            <ResourceBadge type={type} />
            {id ? (
              <CopyableIdentifier value={id} label="Resource ID" />
            ) : (
              <span className="text-[11px] text-muted-foreground/50 italic font-mono">—</span>
            )}
          </div>
        );
      },
    },

    // 5. Actor (User ID / System)
    {
      id: 'actor',
      accessorKey: 'userId',
      header: 'Actor',
      cell: ({ row }) => {
        const userId = row.original.userId;
        if (!userId) {
          return (
            <span className="text-xs font-mono italic text-muted-foreground/60 whitespace-nowrap">
              System Worker
            </span>
          );
        }
        return (
          <div className="whitespace-nowrap truncate max-w-[150px]">
            <CopyableIdentifier value={userId} label="Actor User ID" />
          </div>
        );
      },
    },

    // 6. HTTP Method & Path / Origin
    {
      id: 'http',
      header: 'Endpoint / Origin',
      cell: ({ row }) => {
        const method = row.original.method;
        const path = row.original.path;

        if (!method && !path) {
          return (
            <span className="text-xs font-mono text-muted-foreground/60 italic whitespace-nowrap">
              Background Job
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs whitespace-nowrap truncate max-w-[220px]">
            <MethodBadge method={method} />
            <span
              className="text-muted-foreground font-medium truncate text-[11px]"
              title={path ?? ''}
            >
              {path ?? '—'}
            </span>
          </div>
        );
      },
    },

    // 7. Status Code (Right-aligned numbers with luminous color dot)
    {
      id: 'status',
      header: () => <div className="text-right">Status</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <StatusBadge code={row.original.statusCode} variant="dot" />
        </div>
      ),
    },

    // 8. Latency / Duration (Right-aligned numeric metric: "Number right")
    {
      id: 'durationMs',
      accessorKey: 'durationMs',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Latency" />
        </div>
      ),
      cell: ({ row }) => {
        const duration = row.original.durationMs;
        if (typeof duration !== 'number') {
          return <div className="text-right font-mono text-xs text-muted-foreground/50">—</div>;
        }

        const durationColor =
          duration < 100
            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
            : duration < 500
              ? 'text-foreground font-medium'
              : 'text-amber-600 dark:text-amber-400 font-semibold';

        return (
          <div
            className={`text-right font-mono text-xs tabular-nums whitespace-nowrap ${durationColor}`}
          >
            {duration}ms
          </div>
        );
      },
      enableSorting: true,
    },

    // 9. Inspect Action Trigger ("Hover does the rest")
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        return (
          <div className="text-right w-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/60 hover:text-foreground hover:bg-muted opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(row.original);
              }}
              title="Inspect full audit event"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Inspect details</span>
            </Button>
          </div>
        );
      },
    },
  ];
}
