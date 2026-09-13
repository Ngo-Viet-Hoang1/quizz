'use client';

import React from 'react';

interface PlayerLobbyViewProps {
  nickname: string;
  quizTitle?: string;
  pin: string;
}

export function PlayerLobbyView({ nickname, quizTitle, pin }: PlayerLobbyViewProps) {
  return (
    <div className="text-center space-y-6 py-10 max-w-xs mx-auto">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
          <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>CONNECTED TO ROOM</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{nickname}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You&apos;re all set! Keep an eye on the host screen — the game will start shortly.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-card border border-border text-xs font-mono text-muted-foreground shadow-xs">
        Quiz: <span className="text-foreground font-medium">{quizTitle || `PIN ${pin}`}</span>
      </div>
    </div>
  );
}
