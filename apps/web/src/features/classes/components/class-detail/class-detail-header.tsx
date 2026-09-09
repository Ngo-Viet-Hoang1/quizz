'use client';

import * as React from 'react';
import Link from 'next/link';
import { useOrganization, useUser } from '@clerk/nextjs';
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Pencil,
  Plus,
  Shield,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button, buttonVariants } from '@/shared/ui/button';
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

  const { user } = useUser();
  const { memberships } = useOrganization({ memberships: { infinite: true } });

  const orgMember = memberships?.data?.find((m) => m.publicUserData?.userId === classItem.ownerId);

  const isCurrentUser = user?.id === classItem.ownerId;

  const teacherName = orgMember?.publicUserData?.firstName
    ? `${orgMember.publicUserData.firstName} ${orgMember.publicUserData.lastName || ''}`.trim()
    : orgMember?.publicUserData?.identifier ||
      (isCurrentUser
        ? user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress
        : classItem.ownerId || 'N/A');

  return (
    <div className="space-y-4 border-b border-border pb-6 pt-1">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/classes"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 gap-1 px-2 text-xs')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>
        <span>/</span>
        <span className="font-medium text-xs text-foreground/80">{classItem.name}</span>
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
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
              {isArchived ? (
                <Archive className="mr-1 h-3 w-3 inline" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3 inline" />
              )}
              {classItem.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary/70" />
              Teacher: <strong className="text-foreground font-medium">{teacherName}</strong>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">
                  You
                </Badge>
              )}
            </span>
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
                className="gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Assign Quiz</span>
              </Button>
              <Button size="sm" onClick={onAddMember} className="gap-1.5 shadow-xs">
                <Plus className="h-4 w-4" />
                <span>Add Member</span>
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          {!isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
