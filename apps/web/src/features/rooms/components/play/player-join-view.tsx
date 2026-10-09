'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Loader2 } from 'lucide-react';

interface PlayerJoinViewProps {
  initialPin?: string;
  onJoin: (pin: string, nickname: string) => void;
}

export function PlayerJoinView({ initialPin = '', onJoin }: PlayerJoinViewProps) {
  const { user } = useUser();
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Auto-populate nickname if student is logged into Clerk
  useEffect(() => {
    if (user?.fullName && !nickname) {
      setNickname(user.fullName);
    } else if (user?.firstName && !nickname) {
      setNickname(user.firstName);
    }
  }, [user, nickname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;

    const cleanPin = pin.trim().replace(/\s+/g, '');
    const cleanName = nickname.trim();

    if (!cleanPin) {
      toast.error('Please enter the room PIN');
      return;
    }
    if (!cleanName) {
      toast.error('Please enter your nickname');
      return;
    }

    setIsJoining(true);
    onJoin(cleanPin, cleanName);

    // Auto-reset joining flag after timeout if connection fails
    setTimeout(() => {
      setIsJoining(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Join Live Room</h1>
        <p className="text-xs text-muted-foreground">
          Enter the 6-digit PIN displayed on the host screen to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Room PIN
          </label>
          <Input
            type="text"
            placeholder="e.g. 849201"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="bg-background border-input text-center font-mono text-xl tracking-widest uppercase h-12 text-foreground focus-visible:ring-emerald-500"
            maxLength={10}
            required
            disabled={isJoining}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Your Nickname
          </label>
          <Input
            type="text"
            placeholder="Enter your display name..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="bg-background border-input text-center text-base h-12 text-foreground focus-visible:ring-emerald-500"
            maxLength={24}
            required
            disabled={isJoining}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isJoining}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 shadow-xs cursor-pointer disabled:opacity-60"
        >
          {isJoining ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Đang vào phòng...</span>
            </span>
          ) : (
            'Join Room'
          )}
        </Button>
      </form>
    </div>
  );
}
