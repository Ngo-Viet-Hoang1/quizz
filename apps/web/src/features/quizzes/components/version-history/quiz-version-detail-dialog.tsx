'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { BookOpen, Clock, History } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatDuration } from '@/shared/lib/date';
import { useQuizVersionDetail } from '../../hooks';
import { VersionQuestionCard } from './version-question-card';

interface QuizVersionDetailDialogProps {
  quizId: string;
  version: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCurrentVersion?: boolean;
}

export function QuizVersionDetailDialog({
  quizId,
  version,
  open,
  onOpenChange,
  isCurrentVersion = false,
}: QuizVersionDetailDialogProps) {
  const { data: versionDetail, isLoading } = useQuizVersionDetail(
    quizId,
    version ?? 0,
    open && Boolean(version),
  );

  const snapshot = versionDetail?.snapshot;
  const questions = snapshot?.questions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="border-b border-border p-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold">Snapshot Version {version}</DialogTitle>
              {isCurrentVersion && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs"
                >
                  Current Active
                </Badge>
              )}
            </div>
            {versionDetail?.createdAt && (
              <span className="text-xs text-muted-foreground font-mono">
                Frozen on {format(new Date(versionDetail.createdAt), 'MMM dd, yyyy HH:mm')}
              </span>
            )}
          </div>

          <DialogDescription className="text-xs text-muted-foreground mt-1.5">
            Immutable snapshot captured when this version was frozen. Questions and answers reflect
            the exact state of the quiz at that time.
          </DialogDescription>

          {/* Quick Snapshot Meta */}
          {snapshot && (
            <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{questions.length} Questions</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {snapshot.timeLimitSec ? formatDuration(snapshot.timeLimitSec) : 'Untimed'}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="truncate max-w-xs text-muted-foreground italic">
                &ldquo;{snapshot.title}&rdquo;
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Questions Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No questions found in this version snapshot.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <VersionQuestionCard key={q._id || idx} question={q} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border p-4 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
