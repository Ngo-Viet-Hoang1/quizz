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

  // Calculate animated progress bar percentage based on status
  const progressPercent = isCompleted ? 100 : isProcessing ? 65 : 25;

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
      <DialogContent className="sm:max-w-lg">
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

        <div className="space-y-6 py-2">
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
                      ? 'AI Generating...'
                      : 'Queued'}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Step Timeline */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3.5 text-xs">
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
                    ? 'Crafting questions, distractors, and explanations...'
                    : isCompleted
                      ? 'Questions and answer keys generated successfully.'
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
                <span>Quiz Ready to Review!</span>
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
