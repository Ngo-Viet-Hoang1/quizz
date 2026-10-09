'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import {
  ROOM_WS_EVENTS,
  RoomPhase,
  PlayerState,
  RoomQuestionSnapshot,
  QuestionStartEvent,
  QuestionRevealEvent,
  AnswerResultResponse,
  RoomEndedEvent,
  RoomClosedEvent,
  RoomErrorResponse,
  JoinedSuccessfullyResponse,
} from '@repo/shared-types';
import { createRoomSocket } from '@/shared/lib/socket';
import type { Socket } from 'socket.io-client';

export interface PlayerSummary {
  nickname: string;
  score: number;
  streak: number;
  rank: number | null;
}

function getOrCreatePlayerId(pin: string): string | null {
  if (typeof window === 'undefined') return null;
  const storageKey = `quiz_room_player_${pin}`;
  let playerId = sessionStorage.getItem(storageKey);
  if (!playerId) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem(storageKey, playerId);
  }
  return playerId;
}

export function usePlayerRoom(initialPin: string = '') {
  const { userId } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Connection & Room Status
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [pin, setPin] = useState(initialPin);
  const [quizTitle, setQuizTitle] = useState('');
  const [phase, setPhase] = useState<RoomPhase>(RoomPhase.LOBBY);

  // Gameplay Domain State
  const [player, setPlayer] = useState<PlayerSummary>({
    nickname: '',
    score: 0,
    streak: 0,
    rank: null,
  });
  const [question, setQuestion] = useState<RoomQuestionSnapshot | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResultResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerState[]>([]);

  // Disconnect socket cleanly on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleJoinRoom = useCallback(
    (targetPin: string, targetNickname: string) => {
      setPin(targetPin);
      setPlayer((prev) => ({ ...prev, nickname: targetNickname }));

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = createRoomSocket();
      socketRef.current = socket;
      const playerId = getOrCreatePlayerId(targetPin);

      socket.connect();

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit(ROOM_WS_EVENTS.JOIN_ROOM, {
          pin: targetPin,
          nickname: targetNickname,
          userId: userId ?? null,
          playerId,
        });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on(ROOM_WS_EVENTS.JOINED_SUCCESSFULLY, (payload: JoinedSuccessfullyResponse) => {
        setHasJoined(true);
        setQuizTitle(payload.room.quizTitle || '');
        setPhase(payload.room.phase);
        setTotalQuestions(payload.room.questions?.length || 1);
        setQuestionIndex(payload.room.currentQuestionIndex || 0);

        // Restore score and streak if reconnecting
        const existing = Object.values(payload.room.players || {}).find(
          (p) => p.nickname.toLowerCase() === targetNickname.toLowerCase(),
        );
        if (existing) {
          setPlayer((prev) => ({
            ...prev,
            score: existing.score,
            streak: existing.streak,
          }));
        }

        if (payload.room.phase === RoomPhase.QUESTION_ACTIVE) {
          const currentQ = payload.room.questions?.[payload.room.currentQuestionIndex];
          if (currentQ) {
            setQuestion(currentQ);
            setQuestionStartedAt(payload.room.questionStartedAt || Date.now());
          }
        }
      });

      socket.on(ROOM_WS_EVENTS.QUESTION_START, (payload: QuestionStartEvent) => {
        setPhase(RoomPhase.QUESTION_ACTIVE);
        setSelectedOptionId(null);
        setLastResult(null);
        setQuestion(payload.question ?? null);
        setQuestionIndex(typeof payload.questionIndex === 'number' ? payload.questionIndex : 0);
        setTotalQuestions(typeof payload.totalQuestions === 'number' ? payload.totalQuestions : 1);
        setQuestionStartedAt(payload.startedAt || Date.now());
      });

      socket.on(ROOM_WS_EVENTS.ANSWER_RESULT, (payload: AnswerResultResponse) => {
        setLastResult(payload);
        setPlayer((prev) => ({
          ...prev,
          score: payload.totalScore,
          streak: payload.streak,
        }));
      });

      socket.on(ROOM_WS_EVENTS.QUESTION_REVEAL, (payload: QuestionRevealEvent) => {
        setPhase(RoomPhase.QUESTION_REVEAL);
        if (!payload.leaderboard) return;

        setLeaderboard(payload.leaderboard);
        const myIndex = payload.leaderboard.findIndex(
          (p) => p.nickname.toLowerCase() === targetNickname.toLowerCase(),
        );
        if (myIndex !== -1) {
          setPlayer((prev) => ({ ...prev, rank: myIndex + 1 }));
        }
      });

      socket.on(ROOM_WS_EVENTS.ROOM_ENDED, (payload: RoomEndedEvent) => {
        setPhase(RoomPhase.PODIUM);
        const list = payload.podium || [];
        setLeaderboard(list);
        const myIndex = list.findIndex(
          (p) => p.nickname.toLowerCase() === targetNickname.toLowerCase(),
        );
        if (myIndex !== -1) {
          setPlayer((prev) => ({ ...prev, rank: myIndex + 1 }));
        }
      });

      socket.on(ROOM_WS_EVENTS.ROOM_CLOSED, (payload: RoomClosedEvent) => {
        setPhase(RoomPhase.PODIUM);
        setLeaderboard(payload.leaderboard || []);
      });

      socket.on(ROOM_WS_EVENTS.ROOM_ERROR, (payload: RoomErrorResponse) => {
        const errorMsg = payload.message || 'Failed to join room';
        toast.error(errorMsg);
        socket.disconnect();
        setIsConnected(false);

        const lower = errorMsg.toLowerCase();
        if (lower.includes('expired') || lower.includes('not found') || lower.includes('closed')) {
          setIsExpired(true);
        }
      });
    },
    [userId],
  );

  const submitAnswer = useCallback(
    (optionId: string) => {
      if (!socketRef.current || selectedOptionId) return;

      setSelectedOptionId(optionId);
      socketRef.current.emit(ROOM_WS_EVENTS.SUBMIT_ANSWER, {
        pin: pin.trim().replace(/\s+/g, ''),
        optionId,
      });
    },
    [selectedOptionId, pin],
  );

  return {
    isConnected,
    hasJoined,
    isExpired,
    phase,
    pin,
    quizTitle,
    player,
    question,
    questionIndex,
    totalQuestions,
    questionStartedAt,
    selectedOptionId,
    lastResult,
    leaderboard,
    joinRoom: handleJoinRoom,
    submitAnswer,
  };
}

export type PlayerRoomSession = ReturnType<typeof usePlayerRoom>;
