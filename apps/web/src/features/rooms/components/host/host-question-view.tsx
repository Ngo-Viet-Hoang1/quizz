'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  PlayerState,
  QuestionRevealEvent,
  RoomPhase,
  RoomQuestionSnapshot,
} from '@repo/shared-types';
import { useCountdownTimer } from '../../hooks';
import { RoomLeaderboard, RoomQuestionCard } from '../shared';

interface HostQuestionViewProps {
  phase: RoomPhase;
  question: RoomQuestionSnapshot;
  currentQIndex: number;
  totalQuestions: number;
  startedAt: number | null;
  timeLimitSec: number;
  answeredCount: number;
  playerCount: number;
  revealData: QuestionRevealEvent | null;
  leaderboard: PlayerState[];
  isLastQuestion: boolean;
  onRevealAnswers: () => void;
  onNextQuestion: () => void;
}

function HostActionBar({
  isRevealed,
  isLast,
  onRevealAnswers,
  onNextQuestion,
}: {
  isRevealed: boolean;
  isLast: boolean;
  onRevealAnswers: () => void;
  onNextQuestion: () => void;
}) {
  if (!isRevealed) {
    return (
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-mono text-muted-foreground">
          Waiting for candidate responses...
        </span>
        <Button
          variant="outline"
          onClick={onRevealAnswers}
          className="px-5 font-medium cursor-pointer"
        >
          Reveal Answers Now
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <span className="text-xs font-mono text-muted-foreground">
        {isLast ? 'This is the final question' : 'Ready to advance to next question'}
      </span>
      <Button
        size="lg"
        onClick={onNextQuestion}
        className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 font-semibold cursor-pointer"
      >
        {isLast ? 'View Final Results' : 'Next Question'}
      </Button>
    </div>
  );
}

export function HostQuestionView({
  phase,
  question,
  currentQIndex,
  totalQuestions,
  startedAt,
  timeLimitSec,
  answeredCount,
  playerCount,
  revealData,
  leaderboard,
  isLastQuestion,
  onRevealAnswers,
  onNextQuestion,
}: HostQuestionViewProps) {
  const isRevealed = phase === RoomPhase.QUESTION_REVEAL;
  const { timeLeft, isUrgent } = useCountdownTimer({
    startedAt: isRevealed ? null : startedAt,
    timeLimitSec,
  });

  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Status Bar: Question Progress, Countdown Timer, Submissions */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-0.5">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Progress
          </span>
          <div className="text-lg font-bold font-mono text-foreground">
            Question {currentQIndex + 1} / {totalQuestions}
          </div>
        </div>

        {/* Live Countdown Clock (Minimalist Typography) */}
        {!isRevealed && (
          <div className="flex items-center bg-card border border-border px-5 py-2 rounded-xl shadow-2xs">
            <span
              className={cn(
                'text-2xl font-bold font-mono tabular-nums tracking-tight',
                isUrgent ? 'text-rose-600 animate-pulse' : 'text-foreground',
              )}
            >
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Submitted Count */}
        <div className="text-right space-y-0.5">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Submitted
          </span>
          <div className="text-lg font-bold font-mono text-emerald-600 tabular-nums">
            {answeredCount} / {playerCount}
          </div>
        </div>
      </div>

      {/* Question and Real-time Standings (Dual-pane on Reveal) */}
      <div
        className={cn(
          'min-w-0 w-full',
          isRevealed ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start' : 'space-y-4',
        )}
      >
        <div className={cn('min-w-0', isRevealed ? 'lg:col-span-7' : 'w-full')}>
          <RoomQuestionCard
            content={question.content}
            options={question.options}
            correctOptionIds={revealData?.correctOptionIds}
            stats={revealData?.stats}
            totalAnswered={answeredCount}
            columns={isRevealed ? 1 : 2}
          />
        </div>

        {isRevealed && (
          <div className="lg:col-span-5 min-w-0">
            <RoomLeaderboard leaderboard={leaderboard} title="Live Standings" maxItems={5} />
          </div>
        )}
      </div>

      {/* Host Single-Action Controller */}
      <HostActionBar
        isRevealed={isRevealed}
        isLast={isLastQuestion}
        onRevealAnswers={onRevealAnswers}
        onNextQuestion={onNextQuestion}
      />
    </div>
  );
}
