'use client';

import { cn } from '@/shared/lib/utils';
import { AnswerResultResponse, PlayerState } from '@repo/shared-types';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PlayerSummary } from '../../hooks';
import { RoomLeaderboard } from '../shared';

interface PlayerRevealViewProps {
  result: AnswerResultResponse | null;
  selectedOptionId: string | null;
  player: PlayerSummary;
  leaderboard: PlayerState[];
}

function getFeedbackData(isCorrect: boolean, hasAnswered: boolean, scoreGained: number) {
  if (isCorrect) {
    return {
      Icon: CheckCircle2,
      textColor: 'text-emerald-600',
      boxColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      title: 'Correct!',
      subtitle: `+${scoreGained} pts`,
    };
  }

  if (hasAnswered) {
    return {
      Icon: XCircle,
      textColor: 'text-rose-600',
      boxColor: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
      title: 'Incorrect',
      subtitle: 'Keep going in the next round!',
    };
  }

  return {
    Icon: Clock,
    textColor: 'text-amber-600',
    boxColor: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    title: 'Time Expired',
    subtitle: 'No answer was submitted (+0 pts)',
  };
}

export function PlayerRevealView({
  result,
  selectedOptionId,
  player,
  leaderboard,
}: PlayerRevealViewProps) {
  const isCorrect = Boolean(result?.isCorrect);
  const scoreGained = result?.scoreGained || 0;
  const hasAnswered = Boolean(selectedOptionId);
  const feedback = getFeedbackData(isCorrect, hasAnswered, scoreGained);
  const Icon = feedback.Icon;

  return (
    <div className="w-full max-w-4xl mx-auto my-auto flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-start space-y-4 md:space-y-0">
      {/* Left Column: Personal Result & Score Card */}
      <div className="md:col-span-5 space-y-3.5 flex flex-col items-center md:items-stretch">
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 text-center">
          <div className="space-y-2">
            {Icon ? (
              <div
                className={cn(
                  'size-12 rounded-full border flex items-center justify-center mx-auto',
                  feedback.boxColor,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
            ) : (
              <div
                className={cn(
                  'px-3.5 py-1 rounded-full border font-mono text-xs font-semibold inline-block mx-auto',
                  feedback.boxColor,
                )}
              >
                TIME EXPIRED
              </div>
            )}
            <div className="space-y-0.5">
              <h2 className={cn('text-xl font-bold', feedback.textColor)}>{feedback.title}</h2>
              <p className="text-xs font-mono text-muted-foreground">{feedback.subtitle}</p>
            </div>
          </div>

          {/* Total Score & Streak Bar */}
          <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground uppercase">Your Score:</span>
            <div className="flex items-center gap-2">
              {player.streak > 1 && (
                <span className="text-amber-600 font-semibold bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                  {player.streak}x streak
                </span>
              )}
              <span className="text-foreground font-bold tabular-nums text-sm">
                {player.score.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Live Standings Leaderboard */}
      <div className="md:col-span-7 w-full">
        <RoomLeaderboard
          leaderboard={leaderboard}
          myNickname={player.nickname}
          myRank={player.rank}
          title="Live Standings"
          maxItems={5}
        />
      </div>
    </div>
  );
}
