'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Send } from 'lucide-react';

interface SubmitConfirmModalProps {
  open: boolean;
  answeredCount: number;
  totalQuestions: number;
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function SubmitConfirmModal({
  open,
  answeredCount,
  totalQuestions,
  isPending,
  onClose,
  onSubmit,
}: SubmitConfirmModalProps) {
  if (!open) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <Card className="rounded-2xl border border-border shadow-xl max-w-md w-full animate-in zoom-in-95 duration-150">
        <CardContent className="p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
            <Send className="size-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Submit Exam?</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong>{' '}
            questions.
            {unansweredCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 block mt-1.5 font-medium">
                {unansweredCount} question(s) remain unanswered.
              </span>
            )}
          </p>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-semibold border-border"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={onSubmit}
              disabled={isPending}
            >
              <Send className="size-4" />
              {isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
