'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ViolationWarningModalProps {
  open: boolean;
  violationCount: number;
  onClose: () => void;
}

export function ViolationWarningModal({
  open,
  violationCount,
  onClose,
}: ViolationWarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <Card className="rounded-2xl border border-red-200 dark:border-red-900 shadow-xl max-w-md w-full animate-in zoom-in-95 duration-150">
        <CardContent className="p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto mb-4">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Proctoring Violation Warning</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Tab switching or leaving the exam window has been detected. This activity has been
            recorded in the exam log.
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2.5 font-semibold">
            Total violations recorded: {violationCount}
          </p>
          <Button
            className="mt-6 rounded-xl w-full font-bold bg-foreground text-background hover:bg-foreground/90"
            onClick={onClose}
          >
            I Understand, Resume Exam
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
