'use client';

import * as React from 'react';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { QuestionDifficulty, QuestionItem, QuestionType } from '../../types';

const questionTypeLabelMap: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Single Choice',
  [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QuestionType.TRUE_FALSE]: 'True / False',
  [QuestionType.FILL_BLANK]: 'Fill in Blank',
  [QuestionType.ORDERING]: 'Ordering',
};

const difficultyColorMap: Record<QuestionDifficulty, string> = {
  [QuestionDifficulty.EASY]: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  [QuestionDifficulty.MEDIUM]: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  [QuestionDifficulty.HARD]: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
};

interface VersionQuestionCardProps {
  question: QuestionItem;
  index: number;
}

export function VersionQuestionCard({ question, index }: VersionQuestionCardProps) {
  const difficultyClass =
    question.difficulty && difficultyColorMap[question.difficulty]
      ? difficultyColorMap[question.difficulty]
      : 'border-border bg-muted/60 text-muted-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs space-y-3">
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <Badge variant="outline" className="text-xs font-normal">
            {questionTypeLabelMap[question.type] || question.type}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {question.difficulty && (
            <Badge variant="outline" className={cn('capitalize text-[11px]', difficultyClass)}>
              {question.difficulty}
            </Badge>
          )}
          <span className="font-mono text-muted-foreground">
            {question.points ?? 1} {question.points === 1 ? 'pt' : 'pts'}
          </span>
        </div>
      </div>

      {/* Question Content */}
      <p className="text-sm font-medium leading-relaxed text-foreground">{question.content}</p>

      {/* Options or Answer display */}
      {question.options && question.options.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 pt-1">
          {question.options.map((opt, oIdx) => {
            const isCorrect = Boolean(opt.isCorrect);
            return (
              <div
                key={opt._id || oIdx}
                className={cn(
                  'flex items-start gap-2.5 rounded-md border p-2.5 text-xs transition-colors',
                  isCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-foreground font-medium'
                    : 'border-border/60 bg-muted/30 text-muted-foreground',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                  )}
                </div>
                <span className={cn('flex-1 font-medium', isCorrect && 'text-foreground')}>
                  {opt.content}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Fill blank metadata fallback */}
      {question.type === QuestionType.FILL_BLANK && question.metadata?.correctText && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
          <span className="font-semibold text-emerald-500">Correct Text Answer: </span>
          <span className="font-mono text-foreground">{question.metadata.correctText}</span>
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
