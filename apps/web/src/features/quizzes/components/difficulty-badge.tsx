import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { QuizDifficulty } from '../types';

interface DifficultyBadgeProps {
  difficulty?: QuizDifficulty | string;
  className?: string;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  [QuizDifficulty.EASY]: {
    label: 'Easy',
    className: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10',
  },
  [QuizDifficulty.MEDIUM]: {
    label: 'Medium',
    className: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  },
  [QuizDifficulty.HARD]: {
    label: 'Hard',
    className: 'border-rose-500/30 text-rose-500 bg-rose-500/10',
  },
  [QuizDifficulty.MIXED]: {
    label: 'Mixed',
    className: 'border-purple-500/30 text-purple-500 bg-purple-500/10',
  },
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config =
    (difficulty && difficultyConfig[difficulty]) || difficultyConfig[QuizDifficulty.MEDIUM];

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-1.5 py-0 font-medium tracking-wide capitalize',
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
