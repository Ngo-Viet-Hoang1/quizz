'use client';

import * as React from 'react';
import { History, Layers } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';
import { useQuizVersions } from '../../hooks';
import { VersionTimelineItem } from './version-timeline-item';
import { QuizVersionDetailDialog } from './quiz-version-detail-dialog';

interface QuizVersionHistorySheetProps {
  quizId: string;
  currentVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizVersionHistorySheet({
  quizId,
  currentVersion = 1,
  open,
  onOpenChange,
}: QuizVersionHistorySheetProps) {
  const { data: response, isLoading } = useQuizVersions(
    quizId,
    open ? { sortBy: 'version', sortOrder: 'desc' } : undefined,
  );

  const [selectedVersion, setSelectedVersion] = React.useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  const versions = response?.data ?? [];

  const handleViewSnapshot = (version: number) => {
    setSelectedVersion(version);
    setDetailDialogOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md w-full flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="border-b border-border p-6 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <SheetTitle className="text-lg font-bold">Version History</SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              Track immutable frozen snapshots created during publication and updates.
            </SheetDescription>
          </SheetHeader>

          {/* Timeline List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="pl-6 space-y-2 relative">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                <Layers className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No Frozen Versions</p>
                <p className="text-xs max-w-xs text-muted-foreground">
                  Versions are automatically recorded when a quiz is published or updated after
                  publication.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                {versions.map((ver) => (
                  <VersionTimelineItem
                    key={ver._id || ver.version}
                    versionItem={ver}
                    isCurrentVersion={ver.version === currentVersion}
                    onViewSnapshot={handleViewSnapshot}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Snapshot Detail Dialog */}
      <QuizVersionDetailDialog
        quizId={quizId}
        version={selectedVersion}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        isCurrentVersion={selectedVersion === currentVersion}
      />
    </>
  );
}
