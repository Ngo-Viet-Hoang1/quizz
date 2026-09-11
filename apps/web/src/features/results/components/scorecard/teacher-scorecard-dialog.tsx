'use client';

import * as React from 'react';
import { BookOpen, FileCheck } from 'lucide-react';
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
import { useExamAttemptDetail } from '../../hooks';
import { ScorecardSummaryCard } from './scorecard-summary-card';
import { ScorecardViolations } from './scorecard-violations';
import { ScorecardQuestionItem } from './scorecard-question-item';

interface TeacherScorecardDialogProps {
  attemptId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherScorecardDialog({
  attemptId,
  open,
  onOpenChange,
}: TeacherScorecardDialogProps) {
  const { data, isLoading } = useExamAttemptDetail(attemptId ?? '', open && Boolean(attemptId));

  const attempt = data?.attempt;
  const questions = data?.questions ?? [];
  const answers = attempt?.answers ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[95vw] overflow-hidden flex flex-col p-0 rounded-2xl border border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border p-6 pb-4 pr-12">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-xl font-bold truncate">
              {data?.quizTitle || 'Student Exam Scorecard'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Detailed breakdown of student answers, auto-graded scores, and proctoring integrity.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : !attempt ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Unable to load attempt scorecard details.
            </div>
          ) : (
            <>
              {/* Summary Stats Cards */}
              <ScorecardSummaryCard attempt={attempt} />

              {/* Proctoring Violations (if any) */}
              <ScorecardViolations violations={attempt.violations} />

              {/* Questions & Answers Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Question Breakdown ({questions.length})</span>
                </div>

                {questions.map((q, idx) => {
                  const studentAnswer = answers.find((a) => String(a.questionId) === String(q._id));
                  return (
                    <ScorecardQuestionItem
                      key={q._id || idx}
                      question={q}
                      answer={studentAnswer}
                      index={idx}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border p-4 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Scorecard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
