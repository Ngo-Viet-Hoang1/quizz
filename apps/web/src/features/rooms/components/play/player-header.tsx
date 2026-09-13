'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';

interface PlayerHeaderProps {
  isConnected: boolean;
  pin: string;
}

export function PlayerHeader({ isConnected, pin }: PlayerHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border/80 pb-3 mb-5 w-full">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'size-2 rounded-full',
            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40',
          )}
        />
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {pin && (
        <span className="text-xs font-mono text-muted-foreground">
          PIN: <span className="font-semibold text-foreground">{pin}</span>
        </span>
      )}
    </header>
  );
}
