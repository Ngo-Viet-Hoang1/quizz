'use client';

import React from 'react';
import { PlayerState } from '@repo/shared-types';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface RoomLeaderboardProps {
  leaderboard: PlayerState[];
  myNickname?: string;
  myRank?: number | null;
  title?: string;
  maxItems?: number;
  showCorrectCount?: boolean;
}

const RANK_COLORS: Record<number, string> = {
  0: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40',
  1: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  2: 'bg-amber-700/15 text-amber-800 dark:text-amber-500 border-amber-700/30',
};

export function RoomLeaderboard({
  leaderboard,
  myNickname = '',
  myRank,
  title = 'Live Standings',
  maxItems,
  showCorrectCount = false,
}: RoomLeaderboardProps) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="w-full p-6 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-xl">
        No player scores recorded yet.
      </div>
    );
  }

  const cleanMyName = myNickname.trim().toLowerCase();
  const displayList = maxItems ? leaderboard.slice(0, maxItems) : leaderboard;

  return (
    <div className="w-full rounded-xl border border-border bg-card overflow-hidden shadow-xs min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 border-b border-border/70 bg-muted/30">
        <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
          {title}
        </div>
        {myRank && (
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold text-primary border-primary/30 bg-primary/10 shrink-0"
          >
            Rank #{myRank}
          </Badge>
        )}
      </div>

      {/* List items */}
      <div className="divide-y divide-border/60">
        {displayList.map((player, idx) => {
          const isMe = Boolean(cleanMyName && player.nickname.toLowerCase() === cleanMyName);
          const rankColor = RANK_COLORS[idx] || 'bg-muted text-muted-foreground border-transparent';

          return (
            <div
              key={player.nickname}
              className={cn(
                'h-12 px-3.5 sm:px-4 flex items-center justify-between transition-colors text-sm min-w-0 gap-2',
                isMe
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'hover:bg-muted/40 text-foreground',
              )}
            >
              {/* Rank & Nickname (Fluid Responsive Truncate) */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <span
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border shrink-0',
                    rankColor,
                  )}
                >
                  {idx + 1}
                </span>
                <span className="truncate min-w-0 flex-1">
                  {player.nickname}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-primary/80 font-normal shrink-0">
                      (You)
                    </span>
                  )}
                </span>
                {player.streak > 1 && (
                  <span className="hidden sm:inline-flex items-center text-[11px] font-mono text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {player.streak}x streak
                  </span>
                )}
              </div>

              {/* Score & Stats */}
              <div className="text-right shrink-0 ml-2 flex items-center gap-1.5 sm:gap-2 font-mono">
                {showCorrectCount && typeof player.correctAnswersCount === 'number' && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {player.correctAnswersCount} correct •
                  </span>
                )}
                <span className="font-bold tabular-nums text-emerald-600">
                  {player.score.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
