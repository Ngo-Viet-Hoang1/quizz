'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RoomPhase } from '@repo/shared-types';
import { Button } from '@/shared/ui/button';
import { useHostRoom } from '@/features/rooms/hooks';
import { HostHeader, HostLobbyView, HostQuestionView } from '@/features/rooms/components/host';
import { RoomFinalView } from '@/features/rooms/components/shared';

function HostConnectingView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background min-h-screen">
      <div className="flex items-center gap-2.5 text-muted-foreground font-mono text-sm">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Connecting to live session...</span>
      </div>
    </div>
  );
}

function HostMessageCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background min-h-screen">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Link href="/rooms" className="w-full block">
          <Button className="w-full cursor-pointer">Back to Live Rooms</Button>
        </Link>
      </div>
    </div>
  );
}

function HostScreenContent() {
  const searchParams = useSearchParams();
  const pin = searchParams.get('pin') ?? '';
  const host = useHostRoom(pin);

  // Early returns for loading & invalid states
  if (!pin) {
    return (
      <HostMessageCard
        title="Room PIN Not Found"
        description="Please create or launch a live session from the quiz details page."
      />
    );
  }

  if (host.isConnecting) return <HostConnectingView />;

  if (host.isExpired) {
    return (
      <HostMessageCard
        title="Session Concluded"
        description="This room has ended or the PIN has expired. You can review historical reports on your dashboard."
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground">
      {/* 1. Host Header */}
      <HostHeader
        isConnected={host.isConnected}
        quizTitle={host.roomState?.quizTitle}
        playerCount={host.playerCount}
      />

      {/* 2. Declarative Main View by Phase */}
      <main className="flex-1 flex flex-col p-3.5 sm:p-6 max-w-5xl mx-auto w-full">
        {host.phase === RoomPhase.LOBBY && (
          <HostLobbyView
            pin={pin}
            players={host.players}
            playerCount={host.playerCount}
            onStartRoom={host.startRoom}
            onCancelRoom={host.endRoom}
          />
        )}

        {(host.phase === RoomPhase.QUESTION_ACTIVE ||
          host.phase === RoomPhase.QUESTION_REVEAL ||
          host.phase === RoomPhase.LEADERBOARD) &&
          host.currentQuestion && (
            <HostQuestionView
              phase={host.phase}
              question={host.currentQuestion}
              currentQIndex={host.currentQIndex}
              totalQuestions={host.totalQuestions}
              startedAt={host.questionStartedAt}
              timeLimitSec={host.questionTimeLimit}
              answeredCount={host.answeredCount}
              playerCount={host.playerCount}
              revealData={host.revealData}
              leaderboard={host.leaderboard}
              isLastQuestion={host.isLastQuestion}
              onRevealAnswers={host.revealAnswers}
              onNextQuestion={host.nextQuestion}
            />
          )}

        {host.phase === RoomPhase.PODIUM && (
          <RoomFinalView
            leaderboard={host.podium}
            returnHref="/rooms"
            returnLabel="Back to Live Rooms"
          />
        )}
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-sm">
          Initializing live room...
        </div>
      }
    >
      <HostScreenContent />
    </Suspense>
  );
}
