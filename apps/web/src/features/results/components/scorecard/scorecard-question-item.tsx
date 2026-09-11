'use client';

import * as React from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { QuestionItem, QuestionType } from '@/features/quizzes/types';
import { cn } from '@/shared/lib/utils';
import { ExamAttemptAnswer } from '../../types';

interface ScorecardQuestionItemProps {
  question: QuestionItem;
  answer?: ExamAttemptAnswer;
  index: number;
}

export function ScorecardQuestionItem({ question, answer, index }: ScorecardQuestionItemProps) {
  const isCorrect = Boolean(answer?.isCorrect);
  const isAnswered = Boolean(answer);
  const maxPoints = question.points ?? 1;
  const pointsEarned = isCorrect ? maxPoints : 0;
  const selectedOptionIds = answer?.selectedOptionIds || [];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 text-xs transition-all space-y-3',
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : isAnswered
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-border bg-card/50',
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
              isCorrect
                ? 'bg-emerald-500/20 text-emerald-500'
                : isAnswered
                  ? 'bg-rose-500/20 text-rose-500'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {index + 1}
          </span>
          <Badge variant="outline" className="text-xs font-normal">
            {question.type}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'font-mono text-xs font-semibold',
              isCorrect
                ? 'border-emerald-500/40 text-emerald-500'
                : 'border-rose-500/40 text-rose-500',
            )}
          >
            {pointsEarned} / {maxPoints} pt{maxPoints > 1 ? 's' : ''}
          </Badge>
          {isCorrect ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/15 text-emerald-500 gap-1 text-[11px]"
            >
              <CheckCircle2 className="h-3 w-3" /> Correct
            </Badge>
          ) : isAnswered ? (
            <Badge
              variant="outline"
              className="border-rose-500/30 bg-rose-500/15 text-rose-500 gap-1 text-[11px]"
            >
              <XCircle className="h-3 w-3" /> Incorrect
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px]">
              Unanswered
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm font-medium text-foreground leading-relaxed">{question.content}</p>

      {/* Options Display */}
      {question.options && question.options.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 pt-1">
          {question.options.map((opt, oIdx) => {
            const isOptionCorrect = Boolean(opt.isCorrect);
            const isOptionSelected = opt._id ? selectedOptionIds.includes(opt._id) : false;

            return (
              <div
                key={opt._id || oIdx}
                className={cn(
                  'flex items-start gap-2.5 rounded-md border p-2.5 text-xs transition-colors',
                  isOptionCorrect
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-foreground font-medium shadow-2xs'
                    : isOptionSelected && !isOptionCorrect
                      ? 'border-rose-500/50 bg-rose-500/15 text-foreground'
                      : 'border-border/60 bg-muted/20 text-muted-foreground',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isOptionCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : isOptionSelected ? (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1">
                  <span className="font-medium text-foreground">{opt.content}</span>
                  {isOptionSelected && (
                    <span className="ml-2 text-[10px] font-semibold text-primary">
                      (Student Choice)
                    </span>
                  )}
                  {isOptionCorrect && (
                    <span className="ml-2 text-[10px] font-semibold text-emerald-500">
                      (Correct Answer)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fill in blank answer comparison */}
      {question.type === QuestionType.FILL_BLANK && (
        <div className="space-y-1.5 pt-1">
          <div className="rounded-md border border-border p-2.5 bg-muted/30">
            <span className="text-muted-foreground">Student Text Answer: </span>
            <span className="font-mono font-medium text-foreground">
              {answer?.textAnswer || '(Blank)'}
            </span>
          </div>
          {question.metadata?.correctText && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-500">
              <span className="font-semibold">Correct Answer: </span>
              <span className="font-mono text-foreground">{question.metadata.correctText}</span>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          <p>
            <span className="font-semibold text-foreground">Explanation: </span>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
