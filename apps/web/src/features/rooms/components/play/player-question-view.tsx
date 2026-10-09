'use client';

import React from 'react';
import { RoomQuestionSnapshot } from '@repo/shared-types';
import { cn } from '@/shared/lib/utils';
import { RoomQuestionCard } from '../shared';
import { useCountdownTimer } from '../../hooks';

interface PlayerQuestionViewProps {
  question: RoomQuestionSnapshot;
  questionIndex: number;
  totalQuestions: number;
  startedAt: number | null;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
}

export function PlayerQuestionView({
  question,
  questionIndex,
  totalQuestions,
  startedAt,
  selectedOptionId,
  onSelectOption,
}: PlayerQuestionViewProps) {
  const timeLimit = question.timeLimitSec || 30;
  const { timeLeft, isUrgent } = useCountdownTimer({
    startedAt,
    timeLimitSec: timeLimit,
  });

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 my-auto flex flex-col justify-center min-w-0">
      {/* Top Question Progress & Minimalist Numeric Timer */}
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground border-b border-border pb-2 w-full">
        <span className="font-semibold tracking-wide">
          QUESTION {questionIndex + 1} / {totalQuestions}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'tabular-nums font-mono font-bold text-sm transition-colors',
              isUrgent ? 'text-rose-600 animate-pulse' : 'text-foreground',
            )}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Question and Touch-friendly Options */}
      <RoomQuestionCard
        content={question.content}
        options={question.options}
        selectedOptionId={selectedOptionId}
        isSelectable={timeLeft > 0}
        onSelectOption={onSelectOption}
        columns={1}
      />

      {/* Real-time Inline Submission Status */}
      {selectedOptionId ? (
        <div className="text-center py-2 px-4 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          ✓ Answer submitted! Waiting for host to reveal results...
        </div>
      ) : timeLeft <= 0 ? (
        <div className="text-center py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-600">
          Time&apos;s up! Waiting for results...
        </div>
      ) : null}
    </div>
  );
}
