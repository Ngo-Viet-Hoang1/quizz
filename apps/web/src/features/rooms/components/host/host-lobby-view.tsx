'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { PlayerState } from '@repo/shared-types';
import { Button } from '@/shared/ui/button';

interface HostLobbyViewProps {
  pin: string;
  players: Record<string, PlayerState>;
  playerCount: number;
  onStartRoom: () => void;
  onCancelRoom?: () => void;
}

export function HostLobbyView({
  pin,
  players,
  playerCount,
  onStartRoom,
  onCancelRoom,
}: HostLobbyViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined' && pin ? `${window.location.origin}/room/play?pin=${pin}` : '';

  // Generate QR code for Lobby
  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        margin: 1,
        width: 220,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [joinUrl]);

  const handleCopyJoinLink = () => {
    if (!joinUrl) return;
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => {
        setCopied(true);
        toast.success('Join link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Failed to copy link'));
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4 max-w-4xl mx-auto w-full">
      {/* Unified Clean PIN & QR Card */}
      <div className="rounded-2xl bg-card border border-border p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 shadow-xs">
        <div className="space-y-4 text-center sm:text-left flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-mono text-foreground border border-border/60 max-w-full truncate">
            <span className="text-muted-foreground shrink-0">Join:</span>
            <span className="font-semibold text-primary truncate">
              {joinUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
              ROOM PIN
            </span>
            <div className="text-5xl sm:text-7xl font-black font-mono tracking-widest text-foreground select-all">
              {pin}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleCopyJoinLink}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'Link Copied' : 'Copy Invitation Link'}</span>
            </button>
          </div>
        </div>

        {/* Minimal QR Code */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="p-3 bg-white rounded-xl shadow-xs border border-border">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-36 h-36 object-contain" />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-muted-foreground font-mono text-xs">
                Generating QR...
              </div>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono mt-2">Scan to Join</span>
        </div>
      </div>

      {/* Simple Participant Roster */}
      <div className="my-6 flex-1 flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Joined Players ({playerCount})
          </span>
          {playerCount === 0 && (
            <span className="text-xs text-muted-foreground italic font-mono">
              Waiting for players to enter PIN...
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 max-h-[160px] overflow-y-auto pr-1">
          {Object.values(players).map((p) => (
            <span
              key={p.nickname}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground shadow-2xs"
            >
              {p.nickname}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Host Action Bar */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <span className="text-xs text-muted-foreground font-mono">
          {playerCount === 0
            ? 'At least 1 player required to begin'
            : `Ready with ${playerCount} player(s)`}
        </span>
        <div className="flex items-center gap-2.5">
          {onCancelRoom && (
            <Button
              variant="outline"
              size="lg"
              onClick={onCancelRoom}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-xl font-medium cursor-pointer"
            >
              Cancel Room
            </Button>
          )}
          <Button
            size="lg"
            onClick={onStartRoom}
            disabled={playerCount === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 font-semibold shadow-xs disabled:opacity-40 rounded-xl cursor-pointer"
          >
            Start Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
