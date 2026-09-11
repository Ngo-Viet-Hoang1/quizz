'use client';

import * as React from 'react';
import { BookOpen, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { GradebookTable } from './gradebook-table';

interface AssignmentGradebookSheetProps {
  assignmentId: string | null;
  quizTitle?: string;
  classNameTitle?: string;
  quizVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewScorecard: (attemptId: string) => void;
}

export function AssignmentGradebookSheet({
  assignmentId,
  quizTitle = 'Quiz Assessment',
  classNameTitle = 'Classroom',
  quizVersion = 1,
  open,
  onOpenChange,
  onViewScorecard,
}: AssignmentGradebookSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="border-b border-border p-6 pb-4 pr-12">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              <SheetTitle className="text-lg font-bold truncate">{quizTitle}</SheetTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <Badge variant="outline" className="font-mono text-xs">
                v{quizVersion}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {classNameTitle}
              </Badge>
            </div>
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Student submission gradebook, auto-graded marks, and proctoring integrity.
          </SheetDescription>
        </SheetHeader>

        {/* Gradebook Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Student Submissions</span>
            </div>

            <GradebookTable assignmentId={assignmentId ?? ''} onViewScorecard={onViewScorecard} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
