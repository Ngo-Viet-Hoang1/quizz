'use client';

import * as React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
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
import { Skeleton } from '@/shared/ui/skeleton';
import { Textarea } from '@/shared/ui/textarea';
import { useQuizReportDetail, useResolveQuizReport } from '../hooks';
import { ReportReasonBadge, ReportStatusBadge } from './quiz-report-badge';
import { ReportStatus } from '../types';

interface QuizReportDetailDialogProps {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizReportDetailDialog({
  reportId,
  open,
  onOpenChange,
}: QuizReportDetailDialogProps) {
  const { data, isLoading, isError } = useQuizReportDetail(
    reportId ?? '',
    Boolean(reportId && open),
  );
  const resolveMutation = useResolveQuizReport();

  const [resolutionNotes, setResolutionNotes] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setResolutionNotes('');
    }
  }, [open, reportId]);

  const report = data?.report;
  const question = data?.question;

  const handleResolve = async (status: ReportStatus.RESOLVED | ReportStatus.REJECTED) => {
    if (!reportId) return;

    try {
      await resolveMutation.mutateAsync({
        id: reportId,
        payload: {
          status,
          resolutionNotes: resolutionNotes.trim() || undefined,
        },
      });

      toast.success(
        status === ReportStatus.RESOLVED
          ? 'Report approved: Question voided and excluded from total score!'
          : 'Report rejected.',
      );
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve report';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pr-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">Quiz Question Report</DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                Report ID: {reportId}
              </DialogDescription>
            </div>
            {report && <ReportStatusBadge status={report.status} />}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : isError || !report ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Failed to load report details.
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Top Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/40 p-4 rounded-lg border">
              <div>
                <div className="text-muted-foreground font-medium">Quiz:</div>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  {report.quizTitle || data?.quizTitle || 'Quiz'}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    (Version {report.quizVersion})
                  </span>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Student Reporter:</div>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  {report.userName || data?.reporterName || report.userId}
                  {(report.userEmail || data?.reporterEmail) && (
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">
                      ({report.userEmail || data?.reporterEmail})
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-[11px] mt-1">
                  Submitted on: {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Main Content 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Column 1: Question Snapshot */}
              <div className="space-y-3 border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Original Question Snapshot
                  </span>
                  {question?.points && (
                    <span className="text-xs font-mono bg-muted px-2.5 py-0.5 rounded text-muted-foreground">
                      {question.points} pt{question.points > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {question ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                      {question.content}
                    </p>

                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {question.options.map((opt, idx) => (
                          <div
                            key={opt._id ?? idx}
                            className={`flex items-start justify-between gap-3 text-xs p-3 rounded-md border transition-colors ${
                              opt.isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 font-medium text-foreground'
                                : 'bg-background border-border text-muted-foreground'
                            }`}
                          >
                            <span className="leading-relaxed flex-1">
                              {String.fromCharCode(65 + idx)}. {opt.content}
                            </span>
                            {opt.isCorrect && (
                              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded shrink-0">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground space-y-1">
                        <span className="font-semibold text-foreground">Explanation:</span>
                        <p className="leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4">
                    No question snapshot available.
                  </p>
                )}
              </div>

              {/* Column 2: Student Feedback & Quick 1-Click Resolution */}
              <div className="space-y-4">
                {/* Student Feedback */}
                <div className="space-y-2.5 border rounded-lg p-4 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                      Report Reason
                    </span>
                    <ReportReasonBadge reason={report.reason} />
                  </div>
                  {report.description || report.comment ? (
                    <div className="text-xs text-foreground bg-background/90 p-3.5 rounded-md border border-border/60 mt-2">
                      <div className="font-semibold text-muted-foreground mb-1.5">
                        Student Note:
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {report.description || report.comment}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No student note provided.
                    </p>
                  )}
                </div>

                {/* Resolution Form or Past Record */}
                {report.status === ReportStatus.PENDING ? (
                  <div className="space-y-3.5 border rounded-lg p-4 bg-muted/20">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Resolution Action (1-Click)
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="resolutionNotes" className="text-xs font-medium">
                        Resolution Note / Feedback for student (optional)
                      </Label>
                      <Textarea
                        id="resolutionNotes"
                        rows={3}
                        placeholder="e.g. Verified question error. This question has been voided and excluded from your total exam score."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={resolveMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-9 gap-1.5 font-medium"
                        onClick={() => handleResolve(ReportStatus.RESOLVED)}
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Accept
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={resolveMutation.isPending}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 flex-1 h-9 gap-1.5 font-medium"
                        onClick={() => handleResolve(ReportStatus.REJECTED)}
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <XCircle className="size-3.5" />
                        )}
                        Reject Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs bg-muted/40 p-4 rounded-lg border space-y-2">
                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                      Resolution Record
                    </div>
                    <div className="text-foreground bg-background p-3.5 rounded-md border">
                      <span className="font-semibold text-muted-foreground">Feedback: </span>
                      {report.resolutionNotes ||
                        report.resolutionNote ||
                        'No resolution feedback provided.'}
                    </div>
                    {report.resolvedAt && (
                      <div className="text-muted-foreground text-[11px] pt-1">
                        Resolved at: {new Date(report.resolvedAt).toLocaleString()}
                        {report.status === ReportStatus.RESOLVED
                          ? ' (Question voided from exam score)'
                          : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t mt-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
