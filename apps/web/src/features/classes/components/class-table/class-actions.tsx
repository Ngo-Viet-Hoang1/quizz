'use client';

import * as React from 'react';
import Link from 'next/link';
import { Archive, Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ClassItem, ClassStatus } from '../../types';

interface ClassRowActionsProps {
  classItem: ClassItem;
  onEdit?: (classItem: ClassItem) => void;
  onArchive?: (classItem: ClassItem) => void;
}

export function ClassRowActions({ classItem, onEdit, onArchive }: ClassRowActionsProps) {
  const classId = classItem.id || classItem._id;
  const isArchived = classItem.status === ClassStatus.ARCHIVED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          render={
            <Link href={`/classes/${classId}`} className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>View Details</span>
            </Link>
          }
        />

        {onEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(classItem)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span>Edit</span>
          </DropdownMenuItem>
        )}

        {!isArchived && onArchive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onArchive(classItem)}
              className="flex items-center gap-2 cursor-pointer text-destructive"
            >
              <Archive className="h-4 w-4" />
              <span>Archive</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
