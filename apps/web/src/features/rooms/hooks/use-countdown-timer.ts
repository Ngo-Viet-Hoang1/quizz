'use client';

import { useEffect, useState } from 'react';

export interface UseCountdownTimerOptions {
  startedAt: number | null | undefined;
  timeLimitSec: number;
  onExpire?: () => void;
}

export function useCountdownTimer({ startedAt, timeLimitSec, onExpire }: UseCountdownTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!startedAt) return timeLimitSec;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, timeLimitSec - elapsed);
  });

  useEffect(() => {
    if (!startedAt) {
      setTimeLeft(timeLimitSec);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timeLimitSec - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [startedAt, timeLimitSec, onExpire]);

  const isUrgent = timeLeft <= 5;
  const progressPercentage =
    timeLimitSec > 0 ? Math.min(100, Math.max(0, (timeLeft / timeLimitSec) * 100)) : 0;

  return {
    timeLeft,
    isUrgent,
    progressPercentage,
  };
}
