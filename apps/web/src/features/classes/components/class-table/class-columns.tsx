'use client';

import * as React from 'react';
import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/shared/ui/badge';
import { DataTableColumnHeader, type DataTableFeatures } from '@/shared/components/data-table';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
import { formatDate } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { ClassItem, ClassStatus } from '../../types';
import { ClassRowActions } from './class-actions';

const columnHelper = createColumnHelper<DataTableFeatures, ClassItem>();

const statusColorMap: Record<string, { className: string; label: string }> = {
  [ClassStatus.ACTIVE]: {
    label: 'Active',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  [ClassStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
};

export function createClassColumns(
  onEdit?: (classItem: ClassItem) => void,
  onArchive?: (classItem: ClassItem) => void,
) {
  return columnHelper.columns([
    columnHelper.accessor('name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CLASS NAME" />,
      cell: ({ row }) => {
        const item = row.original;
        const id = item.id || item._id;
        const isArchived = item.status === ClassStatus.ARCHIVED;

        return (
          <div className="flex items-center gap-2.5 py-1">
            <Link
              href={`/classes/${id}`}
              className={cn(
                'font-medium text-xs text-foreground hover:text-primary transition-colors line-clamp-1',
                isArchived && 'text-muted-foreground line-through',
              )}
            >
              {item.name}
            </Link>
          </div>
        );
      },
    }),

    columnHelper.accessor('ownerId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="INSTRUCTOR" />,
      cell: ({ row }) => <UserAvatarCell userId={row.getValue('ownerId')} size="sm" />,
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) || 'active';
        const config = statusColorMap[status] || {
          label: status,
          className: 'border-border bg-muted/60 text-muted-foreground',
        };

        return (
          <Badge variant="outline" className={cn('font-mono text-xs capitalize', config.className)}>
            {config.label}
          </Badge>
        );
      },
    }),

    columnHelper.accessor('createdAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="CREATED DATE" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(row.getValue('createdAt'))}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <ClassRowActions classItem={row.original} onEdit={onEdit} onArchive={onArchive} />
      ),
    }),
  ]);
}
