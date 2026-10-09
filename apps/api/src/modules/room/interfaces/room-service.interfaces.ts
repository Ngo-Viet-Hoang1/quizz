import { PlayerState, RoomPhase, RoomQuestionSnapshot, RoomState } from '@repo/shared-types';

export interface StartRoomResult {
  room: RoomState;
  question: RoomQuestionSnapshot;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  scoreGained: number;
  totalScore: number;
  streak: number;
  nickname: string;
  answeredCount: number;
  totalPlayers: number;
}

export interface NextQuestionResult {
  nextPhase: RoomPhase;
  question?: RoomQuestionSnapshot;
  questionIndex?: number;
  totalQuestions?: number;
  startedAt?: number | null;
  leaderboard: PlayerState[];
}
