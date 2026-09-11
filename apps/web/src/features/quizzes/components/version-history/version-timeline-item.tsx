'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { BookOpen, Clock, Eye, GitCommit } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { QuizVersionItem } from '../../types';

interface VersionTimelineItemProps {
  versionItem: QuizVersionItem;
  isCurrentVersion: boolean;
  onViewSnapshot: (version: number) => void;
}

export function VersionTimelineItem({
  versionItem,
  isCurrentVersion,
  onViewSnapshot,
}: VersionTimelineItemProps) {
  const { version, snapshot, createdAt } = versionItem;
  const questionCount = snapshot.questions?.length ?? 0;

  return (
    <div className="relative pl-6 pb-6 group">
      {/* Timeline vertical connector line */}
      <div className="absolute left-2.5 top-3 bottom-0 w-px bg-border group-last:hidden" />

      {/* Timeline node icon */}
      <div
        className={cn(
          'absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
          isCurrentVersion
            ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
            : 'border-border bg-card text-muted-foreground',
        )}
      >
        <GitCommit className="h-3 w-3" />
      </div>

      {/* Version Card */}
      <div
        className={cn(
          'rounded-lg border p-3.5 transition-all text-xs space-y-2.5',
          isCurrentVersion
            ? 'border-primary/40 bg-primary/5 shadow-xs'
            : 'border-border bg-card/60 hover:bg-card hover:border-border/80',
        )}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">v{version}</span>
            {isCurrentVersion && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0"
              >
                Current
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
          </span>
        </div>

        {/* Snapshot Title */}
        <p className="font-medium text-foreground line-clamp-1">{snapshot.title}</p>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>
                {questionCount} {questionCount === 1 ? 'question' : 'questions'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {snapshot.timeLimitSec ? formatDuration(snapshot.timeLimitSec) : 'Untimed'}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onViewSnapshot(version)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Snapshot</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
