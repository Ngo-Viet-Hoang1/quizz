'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Flag, Loader2, Send } from 'lucide-react';

import { useQuizReportsApi, quizReportKeys } from '@/features/quiz-reports/api/quiz-reports.api';
import { ReportReason } from '@/features/quiz-reports/types';
import type { FullQuestion } from '@/features/student-portal/types';
import { getIdStr } from '@/features/student-portal/utils/exam.utils';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

const REPORT_REASON_OPTIONS = [
  {
    value: ReportReason.INCORRECT_ANSWER,
    label: 'Incorrect Answer',
    description: 'The correct answer key or option is inaccurate',
  },
  {
    value: ReportReason.UNCLEAR_QUESTION,
    label: 'Unclear Question / Ambiguous',
    description: 'The question text is confusing or lacks necessary information',
  },
  {
    value: ReportReason.TYPO,
    label: 'Typo / Formatting Error',
    description: 'Grammar mistake, spelling typo, or math/formula display issue',
  },
  {
    value: ReportReason.OUTDATED_CONTENT,
    label: 'Outdated Content',
    description: 'Content is obsolete or no longer relevant to curriculum',
  },
  {
    value: ReportReason.OTHER,
    label: 'Other Issue',
    description: 'Other problem requiring instructor review',
  },
] as const;

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: FullQuestion | null;
  questionIndex?: number;
  quizId: string;
  quizVersion?: number;
  attemptId?: string;
}

export function ReportQuestionModal({
  isOpen,
  onClose,
  question,
  questionIndex = 0,
  quizId,
  quizVersion = 1,
  attemptId,
}: ReportQuestionModalProps) {
  const reportsApi = useQuizReportsApi();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<ReportReason>(ReportReason.INCORRECT_ANSWER);
  const [description, setDescription] = useState('');

  const createReportMutation = useMutation({
    mutationFn: (data: {
      quizId: string;
      quizVersion: number;
      questionId: string;
      attemptId?: string;
      reason: ReportReason;
      description: string;
    }) => reportsApi.createReport(data),
    onSuccess: () => {
      toast.success('Question report submitted to instructors successfully!');
      queryClient.invalidateQueries({ queryKey: quizReportKeys.all });
      setDescription('');
      setReason(ReportReason.INCORRECT_ANSWER);
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit report. Please try again!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !quizId) return;

    if (!description.trim()) {
      toast.error('Please enter a detailed description of the issue.');
      return;
    }

    const questionIdStr = getIdStr(question._id);
    if (!questionIdStr) {
      toast.error('Question reference not found.');
      return;
    }

    createReportMutation.mutate({
      quizId: getIdStr(quizId),
      quizVersion: quizVersion || 1,
      questionId: questionIdStr,
      attemptId: attemptId ? getIdStr(attemptId) : undefined,
      reason,
      description: description.trim(),
    });
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Report Question #{questionIndex + 1}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your feedback will be sent directly to the course instructors for review.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Question excerpt preview */}
        <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Flag className="size-3 text-primary" />
            Question Content:
          </p>
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
            {question.content}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Reason selector */}
          <div className="space-y-1.5">
            <Label htmlFor="report-reason" className="text-xs font-semibold text-foreground">
              Report Reason <span className="text-rose-500">*</span>
            </Label>
            <Select value={reason} onValueChange={(val) => setReason(val as ReportReason)}>
              <SelectTrigger
                id="report-reason"
                className="h-10 rounded-xl text-xs font-medium bg-background"
              >
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg">
                {REPORT_REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs py-2">
                    <span className="font-semibold text-foreground">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detailed description */}
          <div className="space-y-1.5">
            <Label htmlFor="report-description" className="text-xs font-semibold text-foreground">
              Detailed Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe why this question or answer is incorrect or needs correction..."
              className="min-h-24 rounded-xl text-xs resize-none bg-background focus-visible:ring-2 focus-visible:ring-sky-500"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createReportMutation.isPending}
              className="rounded-xl font-semibold text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReportMutation.isPending || !description.trim()}
              className="rounded-xl font-semibold text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
            >
              {createReportMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
