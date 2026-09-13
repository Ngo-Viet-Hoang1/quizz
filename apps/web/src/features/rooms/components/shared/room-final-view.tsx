'use client';

import React from 'react';
import Link from 'next/link';
import { PlayerState } from '@repo/shared-types';
import { Button } from '@/shared/ui/button';
import { PlayerSummary } from '../../hooks/use-player-room';
import { RoomLeaderboard } from './room-leaderboard';

interface RoomFinalViewProps {
  leaderboard: PlayerState[];
  player?: PlayerSummary;
  returnHref: string;
  returnLabel: string;
}

export function RoomFinalView({
  leaderboard,
  player,
  returnHref,
  returnLabel,
}: RoomFinalViewProps) {
  const isPlayer = Boolean(player);

  return (
    <div className="flex-1 flex flex-col justify-between py-4 max-w-3xl mx-auto w-full space-y-6 my-auto">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-muted/80 border border-border text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold">
          Final Results
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isPlayer
            ? player?.rank
              ? `You Placed Rank #${player.rank}`
              : 'Quiz Complete!'
            : 'Final Standings'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isPlayer
            ? `You finished the live session with ${player?.score.toLocaleString()} points.`
            : `Summary of live session across ${leaderboard.length} candidates.`}
        </p>
      </div>

      {/* Shared Leaderboard */}
      <RoomLeaderboard
        leaderboard={leaderboard}
        myNickname={player?.nickname}
        myRank={player?.rank}
        title="Final Standings"
        showCorrectCount={!isPlayer}
      />

      {/* Exit Button */}
      <div className="flex items-center justify-center border-t border-border pt-4">
        <Link href={returnHref} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto px-8 font-medium cursor-pointer">
            {returnLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
