'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface HostHeaderProps {
  isConnected: boolean;
  quizTitle?: string;
  playerCount: number;
}

export function HostHeader({ isConnected, quizTitle, playerCount }: HostHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((e) => console.error(e));
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-14 border-b border-border px-3.5 sm:px-6 flex items-center justify-between bg-card sticky top-0 z-20">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Link
          href="/rooms"
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted shrink-0"
          title="Return to Rooms"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-border shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn('size-2 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-rose-500')}
          />
          <span className="text-xs font-mono text-muted-foreground font-medium hidden xs:inline">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground truncate max-w-[140px] sm:max-w-[300px]">
          {quizTitle || 'Live Assessment'}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-xs text-muted-foreground font-mono bg-muted/60 border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg">
          <span className="tabular-nums font-bold text-foreground">{playerCount}</span>
          <span className="ml-1 hidden xs:inline">players</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-muted-foreground hover:text-foreground h-8 px-2 hover:bg-muted hidden sm:inline-flex cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
