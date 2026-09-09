'use client';

import * as React from 'react';
import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { GraduationCap, Shield } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { DataTableColumnHeader, type DataTableFeatures } from '@/shared/components/data-table';
import { formatDate } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { ClassItem, ClassStatus } from '../../types';
import { ClassRowActions } from './class-actions';

import { useOrganization, useUser } from '@clerk/nextjs';

function TeacherNameCell({ ownerId }: { ownerId: string }) {
  const { user } = useUser();
  const { memberships } = useOrganization({
    memberships: {
      infinite: true,
    },
  });

  const orgMember = memberships?.data?.find((m) => m.publicUserData?.userId === ownerId);

  const isCurrentUser = user?.id === ownerId;

  const displayName = orgMember?.publicUserData?.firstName
    ? `${orgMember.publicUserData.firstName} ${orgMember.publicUserData.lastName || ''}`.trim()
    : orgMember?.publicUserData?.identifier ||
      (isCurrentUser
        ? user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress
        : null);

  const finalName = displayName || (ownerId ? `${ownerId.substring(0, 12)}...` : 'N/A');

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Shield className="h-3.5 w-3.5 text-primary/70 shrink-0" />
      <span className="font-medium text-foreground truncate max-w-xs">{finalName}</span>
      {isCurrentUser && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">
          You
        </Badge>
      )}
    </div>
  );
}

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
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <Link
              href={`/classes/${id}`}
              className={cn(
                'font-semibold text-foreground tracking-tight hover:text-primary transition-colors line-clamp-1',
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="OWNER / TEACHER" />,
      cell: ({ row }) => <TeacherNameCell ownerId={row.getValue('ownerId')} />,
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
