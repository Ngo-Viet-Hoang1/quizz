'use client';

import type { SanitizedQuestion } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Send } from 'lucide-react';

interface QuestionPaletteProps {
  questions: SanitizedQuestion[];
  answeredCount: number;
  isQuestionAnswered: (questionId: string) => boolean;
  isQuestionFlagged: (questionId: string) => boolean;
  onScrollToQuestion: (questionId: string) => void;
  onSubmitClick: () => void;
}

export function QuestionPalette({
  questions,
  answeredCount,
  isQuestionAnswered,
  isQuestionFlagged,
  onScrollToQuestion,
  onSubmitClick,
}: QuestionPaletteProps) {
  return (
    <div className="sticky top-32 space-y-4">
      <Card className="rounded-2xl border border-border/80 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Questions List
            </p>
            <Badge
              variant="secondary"
              className="text-[11px] font-semibold bg-muted text-muted-foreground"
            >
              {answeredCount}/{questions.length} Answered
            </Badge>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q._id);
              const isFlagged = isQuestionFlagged(q._id);

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => onScrollToQuestion(q._id)}
                  className={`flex size-10 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    isAnswered
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/70'
                      : 'bg-muted/40 border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 size-2.5 bg-amber-500 rounded-full border-2 border-background" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-border/60 space-y-2.5 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <span className="size-4 rounded-md bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 shrink-0" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-4 rounded-md bg-muted/40 border border-border/80 shrink-0" />
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="relative size-4 rounded-md bg-muted/40 border border-border/80 shrink-0">
                <span className="absolute -top-0.5 -right-0.5 size-2 bg-amber-500 rounded-full border border-background" />
              </span>
              <span>Flagged</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <Button
              onClick={onSubmitClick}
              className="w-full h-11 rounded-xl font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <Send className="size-4" />
              Submit Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
