'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import {
  ROOM_WS_EVENTS,
  RoomPhase,
  RoomState,
  PlayerState,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  QuestionStartEvent,
  QuestionRevealEvent,
  AnswerSubmittedTickEvent,
  RoomEndedEvent,
  RoomClosedEvent,
  RoomErrorResponse,
  JoinedSuccessfullyResponse,
} from '@repo/shared-types';
import { createRoomSocket } from '@/shared/lib/socket';
import type { Socket } from 'socket.io-client';

export function useHostRoom(pin: string) {
  const { userId, isLoaded } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const hasTriggeredReveal = useRef(false);

  // Connection & Room State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  // Gameplay Live State
  const [phase, setPhase] = useState<RoomPhase>(RoomPhase.LOBBY);
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number>(30);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [revealData, setRevealData] = useState<QuestionRevealEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerState[]>([]);
  const [podium, setPodium] = useState<PlayerState[]>([]);

  // Socket.IO event wiring
  useEffect(() => {
    if (!pin || !isLoaded) return;

    const socket = createRoomSocket();
    socketRef.current = socket;

    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit(ROOM_WS_EVENTS.JOIN_ROOM, { pin, userId: userId ?? null });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnecting(false);
      toast.error('Unable to establish real-time socket connection');
    });

    socket.on(ROOM_WS_EVENTS.JOINED_SUCCESSFULLY, (payload: JoinedSuccessfullyResponse) => {
      setRoomState(payload.room);
      setPhase(payload.room.phase);
      setPlayers(payload.room.players || {});
      setCurrentQIndex(payload.room.currentQuestionIndex);
      setIsConnecting(false);

      if (payload.room.phase === RoomPhase.QUESTION_ACTIVE) {
        const q = payload.room.questions?.[payload.room.currentQuestionIndex];
        const limit = q?.timeLimitSec || 30;
        const started = payload.room.questionStartedAt || Date.now();
        setQuestionTimeLimit(limit);
        setQuestionStartedAt(started);
      }

      const answered = Object.values(payload.room.players || {}).filter(
        (p) => p.hasAnsweredCurrentQ,
      ).length;
      setAnsweredCount(answered);
    });

    socket.on(ROOM_WS_EVENTS.PLAYER_JOINED, (payload: PlayerJoinedEvent) => {
      setPlayers((prev) => {
        const next = { ...prev };
        payload.players.forEach((p) => {
          if (!next[p.nickname]) {
            next[p.nickname] = {
              socketId: '',
              userId: null,
              playerId: null,
              nickname: p.nickname,
              score: p.score,
              streak: 0,
              correctAnswersCount: 0,
              hasAnsweredCurrentQ: false,
            };
          }
        });
        return next;
      });
    });

    socket.on(ROOM_WS_EVENTS.PLAYER_LEFT, (payload: PlayerLeftEvent) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[payload.socketId];
        return next;
      });
    });

    socket.on(ROOM_WS_EVENTS.QUESTION_START, (payload: QuestionStartEvent) => {
      hasTriggeredReveal.current = false;
      setPhase(RoomPhase.QUESTION_ACTIVE);
      setRevealData(null);
      setAnsweredCount(0);
      if (typeof payload.questionIndex === 'number') {
        setCurrentQIndex(payload.questionIndex);
      }
      if (payload.leaderboard) {
        setLeaderboard(payload.leaderboard);
      }
      const limit = payload.question?.timeLimitSec || 30;
      const started = payload.startedAt || Date.now();
      setQuestionTimeLimit(limit);
      setQuestionStartedAt(started);
    });

    socket.on(ROOM_WS_EVENTS.ANSWER_SUBMITTED_TICK, (payload: AnswerSubmittedTickEvent) => {
      setAnsweredCount(payload.answeredCount);
    });

    socket.on(ROOM_WS_EVENTS.QUESTION_REVEAL, (payload: QuestionRevealEvent) => {
      setPhase(RoomPhase.QUESTION_REVEAL);
      setRevealData(payload);
      if (payload.leaderboard) {
        setLeaderboard(payload.leaderboard);
      }
    });

    socket.on(ROOM_WS_EVENTS.ROOM_ENDED, (payload: RoomEndedEvent) => {
      setPhase(RoomPhase.PODIUM);
      setPodium(payload.podium || []);
    });

    socket.on(ROOM_WS_EVENTS.ROOM_CLOSED, (payload: RoomClosedEvent) => {
      setPhase(RoomPhase.PODIUM);
      setPodium(payload.leaderboard || []);
    });

    socket.on(ROOM_WS_EVENTS.ROOM_ERROR, (payload: RoomErrorResponse) => {
      setIsConnecting(false);
      const msg = payload.message?.toLowerCase() || '';
      if (
        msg.includes('not found') ||
        msg.includes('expired') ||
        msg.includes('started or ended') ||
        msg.includes('closed')
      ) {
        setIsExpired(true);
      } else {
        toast.error(payload.message || 'An error occurred in the room');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pin, userId, isLoaded]);

  // Host Actions
  const startRoom = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit(ROOM_WS_EVENTS.START_ROOM, { pin });
  }, [pin]);

  const revealAnswers = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit(ROOM_WS_EVENTS.REVEAL_ANSWERS, { pin });
  }, [pin]);

  const nextQuestion = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit(ROOM_WS_EVENTS.NEXT_QUESTION, { pin });
  }, [pin]);

  const endRoom = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit(ROOM_WS_EVENTS.END_ROOM, { pin });
  }, [pin]);

  const playerCount = Object.keys(players).length;
  const currentQuestion = roomState?.questions?.[currentQIndex];
  const totalQuestions = roomState?.questions?.length || 1;
  const isLastQuestion = currentQIndex >= totalQuestions - 1;

  // Auto-reveal when all candidates have answered
  useEffect(() => {
    if (phase !== RoomPhase.QUESTION_ACTIVE || hasTriggeredReveal.current) return;
    if (playerCount > 0 && answeredCount >= playerCount) {
      hasTriggeredReveal.current = true;
      revealAnswers();
    }
  }, [phase, playerCount, answeredCount, revealAnswers]);

  // Auto-reveal when question time limit expires (single clean setTimeout)
  useEffect(() => {
    if (phase !== RoomPhase.QUESTION_ACTIVE || !questionStartedAt || hasTriggeredReveal.current)
      return;
    const elapsed = Date.now() - questionStartedAt;
    const delay = Math.max(0, questionTimeLimit * 1000 - elapsed);

    const timer = setTimeout(() => {
      if (!hasTriggeredReveal.current) {
        hasTriggeredReveal.current = true;
        revealAnswers();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, questionStartedAt, questionTimeLimit, revealAnswers]);

  return {
    isConnected,
    isConnecting,
    isExpired,
    pin,
    roomState,
    phase,
    players,
    playerCount,
    currentQuestion,
    currentQIndex,
    totalQuestions,
    questionStartedAt,
    questionTimeLimit,
    answeredCount,
    revealData,
    leaderboard,
    podium,
    isLastQuestion,
    startRoom,
    revealAnswers,
    nextQuestion,
    endRoom,
  };
}

export type HostRoomSession = ReturnType<typeof useHostRoom>;
