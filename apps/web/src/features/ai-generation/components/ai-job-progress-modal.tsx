'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Progress } from '@/shared/ui/progress';
import { formatAiErrorMessage } from '../constants';
import { AiGenerationJobStatus } from '../types';
import { useAiJobStatus } from '../hooks';

interface AiJobProgressModalProps {
  jobId: string | null;
  topic?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset?: () => void;
}

export function AiJobProgressModal({
  jobId,
  topic,
  open,
  onOpenChange,
  onReset,
}: AiJobProgressModalProps) {
  const router = useRouter();

  const { data: jobStatus } = useAiJobStatus(jobId, {
    enabled: open && Boolean(jobId),
  });

  const status = jobStatus?.status ?? AiGenerationJobStatus.PENDING;
  const isPending = status === AiGenerationJobStatus.PENDING;
  const isProcessing = status === AiGenerationJobStatus.PROCESSING;
  const isCompleted = status === AiGenerationJobStatus.COMPLETED;
  const isFailed = status === AiGenerationJobStatus.FAILED;

  const totalCount = jobStatus?.questionCount || 0;
  const questionsList = jobStatus?.generatedQuestions ?? [];
  const completedCount = jobStatus?.completedCount ?? questionsList.length;

  // Calculate animated progress bar percentage based on status & completed batches
  let progressPercent = 10;
  if (isCompleted) {
    progressPercent = 100;
  } else if (isProcessing) {
    if (totalCount > 0 && completedCount > 0) {
      progressPercent = Math.max(20, Math.min(95, Math.round((completedCount / totalCount) * 100)));
    } else {
      progressPercent = 25;
    }
  } else if (isPending) {
    progressPercent = 10;
  }

  const handleOpenQuizEditor = () => {
    if (jobStatus?.quizId) {
      onOpenChange(false);
      router.push(`/quizzes/${jobStatus.quizId}`);
    }
  };

  const handleTryAgain = () => {
    onOpenChange(false);
    onReset?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <DialogTitle className="text-lg">AI Quiz Generation</DialogTitle>
          </div>
          <DialogDescription className="text-xs line-clamp-2">
            {topic ? `Topic: "${topic}"` : 'Generating assessment questions...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Status:</span>
              <span className="font-semibold text-foreground capitalize">
                {isCompleted
                  ? 'Finished'
                  : isFailed
                    ? 'Failed'
                    : isProcessing
                      ? totalCount > 0
                        ? `Generating (${completedCount}/${totalCount} questions)`
                        : 'AI Generating...'
                      : 'Queued'}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 transition-all duration-500" />
          </div>

          {/* Live Questions Preview (when batches are generated) */}
          {questionsList.length > 0 && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Sparkles className="size-3.5 animate-spin text-primary" />
                  <span>
                    Generated Preview ({completedCount}
                    {totalCount > 0 ? ` / ${totalCount}` : ''} Questions)
                  </span>
                </div>
                {!isCompleted && !isFailed && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary animate-pulse">
                    Streaming in batches...
                  </span>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 pt-1">
                {questionsList.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border bg-card p-2.5 shadow-sm space-y-1.5 text-foreground"
                  >
                    <div className="flex items-start gap-2">
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="font-medium text-xs flex-1 leading-snug">{q.content}</p>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1.5 ${
                              opt.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/20'
                                : 'bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            <span className="font-mono text-[10px] opacity-70">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="truncate">{opt.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Timeline */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3 text-xs">
            {/* Step 1: Queued */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isPending ? (
                  <Loader2 className="size-4 text-primary animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">1. Job Queued in Background</p>
                <p className="text-muted-foreground text-[11px]">
                  Request queued in BullMQ job processor.
                </p>
              </div>
            </div>

            {/* Step 2: Processing */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isProcessing ? (
                  <Loader2 className="size-4 text-primary animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : isFailed ? (
                  <AlertTriangle className="size-4 text-destructive" />
                ) : (
                  <div className="size-4 rounded-full border-2 border-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">2. Claude AI Generation</p>
                <p className="text-muted-foreground text-[11px]">
                  {isProcessing
                    ? totalCount > 0
                      ? `Generated ${completedCount}/${totalCount} questions (batching in progress)...`
                      : 'Crafting questions, distractors, and explanations...'
                    : isCompleted
                      ? `Successfully generated ${completedCount || totalCount} questions.`
                      : 'Waiting for AI processor.'}
                </p>
              </div>
            </div>

            {/* Step 3: Finalizing */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : isFailed ? (
                  <AlertTriangle className="size-4 text-destructive" />
                ) : (
                  <div className="size-4 rounded-full border-2 border-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">3. Save Quiz Draft</p>
                <p className="text-muted-foreground text-[11px]">
                  {isCompleted ? 'Quiz draft saved to Quiz Bank.' : 'Awaiting completion.'}
                </p>
              </div>
            </div>
          </div>

          {/* Failure Alert */}
          {isFailed && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Generation Failed</span>
              </div>
              <p className="text-[11px] text-destructive/90">
                {formatAiErrorMessage(jobStatus?.errorMessage)}
              </p>
            </div>
          )}

          {/* Success Summary */}
          {isCompleted && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <FileCheck2 className="size-4 shrink-0" />
                <span>Quiz Ready to Review! ({completedCount || totalCount} Questions)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your AI quiz draft has been generated. You can now edit questions, adjust time
                limits, or publish it immediately.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {isFailed ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button size="sm" onClick={handleTryAgain} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                <span>Try Again</span>
              </Button>
            </>
          ) : isCompleted ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Stay Here
              </Button>
              <Button size="sm" onClick={handleOpenQuizEditor} className="gap-1.5 font-semibold">
                <span>Open Quiz Editor</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Run in Background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
