'use client';

import { cn } from '@/shared/lib/utils';
import { CheckCircle2 } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface OptionItem {
  optionId: string;
  content: string;
}

interface RoomQuestionCardProps {
  content: string;
  options: OptionItem[];
  selectedOptionId?: string | null;
  correctOptionIds?: string[];
  stats?: Record<string, number>;
  totalAnswered?: number;
  isSelectable?: boolean;
  onSelectOption?: (optionId: string) => void;
  columns?: 1 | 2;
}

function OptionCard({
  opt,
  idx,
  isRevealed,
  isSelected,
  isCorrect,
  voteCount,
  votePercentage,
  showStats,
  isSelectable,
  onSelectOption,
  disabled,
}: {
  opt: OptionItem;
  idx: number;
  isRevealed: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  voteCount: number;
  votePercentage: number;
  showStats: boolean;
  isSelectable: boolean;
  onSelectOption?: (optionId: string) => void;
  disabled: boolean;
}) {
  const label = OPTION_LABELS[idx % 4];

  // Resolve card styles cleanly
  let cardStyle = 'border-border/80 bg-card text-foreground';
  let badgeStyle = 'bg-muted text-foreground border-border/80';

  if (isRevealed) {
    if (isCorrect) {
      cardStyle = 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30';
      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
    } else {
      cardStyle = 'opacity-50 border-border/40 bg-muted/20 text-muted-foreground';
      badgeStyle = 'bg-muted/50 text-muted-foreground border-border/40';
    }
  } else if (isSelected) {
    cardStyle = 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-600/30';
    badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
  }

  const Tag = isSelectable ? 'button' : 'div';

  return (
    <Tag
      type={isSelectable ? 'button' : undefined}
      onClick={isSelectable && onSelectOption ? () => onSelectOption(opt.optionId) : undefined}
      disabled={disabled}
      className={cn(
        'w-full min-w-0 overflow-hidden p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-left transition-all shadow-2xs select-none touch-manipulation',
        cardStyle,
        isSelectable && !disabled && 'cursor-pointer hover:bg-muted/40 active:scale-[0.99]',
        isSelectable && disabled && 'cursor-default',
      )}
    >
      <div className="flex items-center gap-3 w-full min-w-0">
        <span
          className={cn(
            'size-7 sm:size-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 border transition-colors',
            badgeStyle,
          )}
        >
          {label}
        </span>

        <span className="text-sm sm:text-base font-semibold leading-relaxed flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
          {opt.content}
        </span>

        {/* Compact Inline Stats Pill inside the card */}
        {showStats && (
          <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs">
            <span
              className={cn(
                'px-2 py-0.5 rounded-md font-semibold tabular-nums border text-xs',
                isCorrect
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 font-bold'
                  : 'bg-muted text-muted-foreground border-border/60',
              )}
            >
              {votePercentage}%
            </span>
            <span className="text-[11px] text-muted-foreground hidden xs:inline tabular-nums">
              ({voteCount})
            </span>
          </div>
        )}

        {isRevealed && isCorrect && (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 ml-1.5" />
        )}
      </div>
    </Tag>
  );
}

export function RoomQuestionCard({
  content,
  options,
  selectedOptionId,
  correctOptionIds,
  stats,
  totalAnswered = 0,
  isSelectable = false,
  onSelectOption,
  columns = 2,
}: RoomQuestionCardProps) {
  const isRevealed = Boolean(correctOptionIds && correctOptionIds.length > 0);

  if (!options || options.length === 0) {
    return (
      <div className="w-full p-8 rounded-2xl bg-card border border-border text-center text-sm text-muted-foreground font-mono">
        Loading question options...
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 min-w-0">
      {/* Question Content Display */}
      <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border text-center shadow-xs min-w-0">
        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-snug break-words [overflow-wrap:anywhere]">
          {content || 'Loading question...'}
        </h2>
      </div>

      {/* Options Grid: 1 column for compact mobile, 2 columns for wide host screen */}
      <div
        className={cn(
          'min-w-0 w-full',
          columns === 1
            ? 'flex flex-col gap-2.5 sm:gap-3'
            : 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4',
        )}
      >
        {options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.optionId;
          const isCorrect = isRevealed && Boolean(correctOptionIds?.includes(opt.optionId));
          const voteCount = stats?.[opt.optionId] ?? 0;
          const votePercentage =
            totalAnswered > 0 ? Math.round((voteCount / totalAnswered) * 100) : 0;
          const disabled = isSelectable && (!onSelectOption || Boolean(selectedOptionId));

          return (
            <OptionCard
              key={opt.optionId}
              opt={opt}
              idx={idx}
              isRevealed={isRevealed}
              isSelected={isSelected}
              isCorrect={isCorrect}
              voteCount={voteCount}
              votePercentage={votePercentage}
              showStats={Boolean(isRevealed && stats)}
              isSelectable={isSelectable}
              onSelectOption={onSelectOption}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
