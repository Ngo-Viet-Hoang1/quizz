'use client';

import {
  PlayerHeader,
  PlayerJoinView,
  PlayerLobbyView,
  PlayerQuestionView,
  PlayerRevealView,
} from '@/features/rooms/components/play';
import { RoomFinalView } from '@/features/rooms/components/shared';
import { usePlayerRoom } from '@/features/rooms/hooks';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { RoomPhase } from '@repo/shared-types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PlayerMessageCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background min-h-screen my-auto">
      <div className="max-w-xs w-full p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Link href="/" className="w-full block">
          <Button variant="outline" className="w-full cursor-pointer font-medium">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PlayerScreenContent() {
  const searchParams = useSearchParams();
  const initialPin = searchParams.get('pin') ?? '';
  const room = usePlayerRoom(initialPin);

  // Early return if room expired or closed
  if (room.isExpired) {
    return (
      <PlayerMessageCard
        title="Session Concluded"
        description="This quiz session has already concluded or the room PIN has expired."
      />
    );
  }

  // Not joined yet -> Render Join Form
  if (!room.hasJoined) {
    return (
      <div className="flex-1 flex flex-col min-h-[100dvh] bg-background text-foreground max-w-md mx-auto w-full px-3.5 sm:px-4 py-3 sm:py-6 overflow-x-hidden justify-center items-center">
        <PlayerJoinView initialPin={initialPin} onJoin={room.joinRoom} />
      </div>
    );
  }

  const isWideLayout = room.phase === RoomPhase.QUESTION_REVEAL || room.phase === RoomPhase.PODIUM;

  return (
    <div
      className={cn(
        'flex-1 flex flex-col min-h-[100dvh] bg-background text-foreground mx-auto w-full px-3.5 sm:px-6 py-3 sm:py-6 overflow-x-hidden transition-all',
        isWideLayout ? 'max-w-4xl' : 'max-w-md',
      )}
    >
      {/* Top Connection & PIN Header */}
      <PlayerHeader isConnected={room.isConnected} pin={room.pin} />

      {/* Symmetric 4-Phase Gameplay Orchestrator */}
      <main className="flex-1 flex flex-col justify-center items-center w-full min-w-0">
        {room.phase === RoomPhase.LOBBY && (
          <PlayerLobbyView
            nickname={room.player.nickname}
            quizTitle={room.quizTitle}
            pin={room.pin}
          />
        )}

        {room.phase === RoomPhase.QUESTION_ACTIVE && room.question && (
          <PlayerQuestionView
            question={room.question}
            questionIndex={room.questionIndex}
            totalQuestions={room.totalQuestions}
            startedAt={room.questionStartedAt}
            selectedOptionId={room.selectedOptionId}
            onSelectOption={room.submitAnswer}
          />
        )}

        {room.phase === RoomPhase.QUESTION_REVEAL && (
          <PlayerRevealView
            result={room.lastResult}
            selectedOptionId={room.selectedOptionId}
            player={room.player}
            leaderboard={room.leaderboard}
          />
        )}

        {room.phase === RoomPhase.PODIUM && (
          <RoomFinalView
            leaderboard={room.leaderboard}
            player={room.player}
            returnHref="/"
            returnLabel="Back to Home"
          />
        )}
      </main>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-sm">
          Connecting to room...
        </div>
      }
    >
      <PlayerScreenContent />
    </Suspense>
  );
}
