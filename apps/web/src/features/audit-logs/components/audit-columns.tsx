'use client';

import {
  CopyableCell,
  createSelectColumn,
  DataTableColumnHeader,
  DateCell,
  NumberCell,
  RowInspectButton,
} from '@/shared/components/data-table';
import { DataTableFeatures } from '@/shared/components/data-table/data-table-features';
import { ColumnDef } from '@tanstack/react-table';
import { AuditLogItem } from '../types';
import { MethodBadge, ResourceBadge, StatusBadge } from './audit-ui-helpers';

export function createAuditColumns(
  onViewDetails: (log: AuditLogItem) => void,
): ColumnDef<DataTableFeatures, AuditLogItem>[] {
  return [
    createSelectColumn<AuditLogItem>(),

    {
      id: 'timestamp',
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ row }) => <DateCell value={row.original.timestamp} mode="split" />,
      enableSorting: true,
    },

    {
      id: 'action',
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Event / Action" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap truncate max-w-[200px]">
          <span className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded truncate">
            {row.original.action}
          </span>
        </div>
      ),
      enableSorting: true,
    },

    {
      id: 'resource',
      header: 'Target Resource',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 whitespace-nowrap min-w-0 max-w-[240px]">
          <ResourceBadge type={row.original.resourceType} />
          {row.original.resourceId ? (
            <CopyableCell
              value={row.original.resourceId}
              label="Resource ID"
              className="min-w-0 flex-1"
            />
          ) : (
            <span className="text-[11px] text-muted-foreground/50 italic font-mono">—</span>
          )}
        </div>
      ),
    },

    {
      id: 'actor',
      accessorKey: 'userId',
      header: 'Actor',
      cell: ({ row }) =>
        row.original.userId ? (
          <div className="flex items-center whitespace-nowrap min-w-0 max-w-[180px]">
            <CopyableCell
              value={row.original.userId}
              label="Actor User ID"
              className="min-w-0 flex-1"
            />
          </div>
        ) : (
          <span className="text-xs font-mono italic text-muted-foreground/60 whitespace-nowrap">
            System Worker
          </span>
        ),
    },

    {
      id: 'http',
      header: 'Endpoint / Origin',
      cell: ({ row }) => {
        const { method, path } = row.original;
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

    {
      id: 'status',
      header: () => <div className="text-right">Status</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <StatusBadge code={row.original.statusCode} variant="dot" />
        </div>
      ),
    },

    {
      id: 'durationMs',
      accessorKey: 'durationMs',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Latency" />
        </div>
      ),
      cell: ({ row }) => (
        <NumberCell
          value={row.original.durationMs}
          unit="ms"
          highlightThresholds={{ warning: 200, danger: 500 }}
        />
      ),
      enableSorting: true,
    },

    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <RowInspectButton
          onClick={() => onViewDetails(row.original)}
          title="Inspect full audit event"
        />
      ),
    },
  ];
}
