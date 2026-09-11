'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button, buttonVariants } from '@/shared/ui/button';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
import { cn } from '@/shared/lib/utils';
import { ClassItem, ClassStatus } from '../../types';

interface ClassDetailHeaderProps {
  classItem: ClassItem;
  onEdit: () => void;
  onArchive: () => void;
  onAddMember: () => void;
  onAssignQuiz: () => void;
}

export function ClassDetailHeader({
  classItem,
  onEdit,
  onArchive,
  onAddMember,
  onAssignQuiz,
}: ClassDetailHeaderProps) {
  const isArchived = classItem.status === ClassStatus.ARCHIVED;

  return (
    <div className="space-y-4 border-b border-border pb-5 pt-1">
      {/* Back button */}
      <div>
        <Link
          href="/classes"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2',
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Classes</span>
        </Link>
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {classItem.name}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'font-mono text-xs capitalize',
                isArchived
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
              )}
            >
              {classItem.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Instructor:</span>
            <UserAvatarCell userId={classItem.ownerId} size="sm" showEmail={false} />
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isArchived && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onAssignQuiz}
                className="gap-1.5 text-xs shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign Quiz</span>
              </Button>
              <Button size="sm" onClick={onAddMember} className="gap-1.5 text-xs shadow-2xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={onEdit} className="text-xs">
            Edit
          </Button>

          {!isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Archive
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
