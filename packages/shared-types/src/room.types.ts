export const ROOM_WS_EVENTS = {
  // Client -> Server
  JOIN_ROOM: 'join_room',
  START_ROOM: 'start_room',
  SUBMIT_ANSWER: 'submit_answer',
  REVEAL_ANSWERS: 'reveal_answers',
  NEXT_QUESTION: 'next_question',
  END_ROOM: 'end_room',

  // Server -> Client
  JOINED_SUCCESSFULLY: 'joined_successfully',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  QUESTION_START: 'question_start',
  ANSWER_RESULT: 'answer_result',
  ANSWER_SUBMITTED_TICK: 'answer_submitted_tick',
  QUESTION_REVEAL: 'question_reveal',
  ROOM_ENDED: 'room_ended',
  ROOM_CLOSED: 'room_closed',
  ROOM_ERROR: 'room_error',
} as const;

export type RoomWsEvent = (typeof ROOM_WS_EVENTS)[keyof typeof ROOM_WS_EVENTS];

export enum RoomPhase {
  LOBBY = 'LOBBY',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  QUESTION_REVEAL = 'QUESTION_REVEAL',
  LEADERBOARD = 'LEADERBOARD',
  PODIUM = 'PODIUM',
}

export interface PlayerState {
  socketId: string;
  userId: string | null;
  playerId?: string | null;
  nickname: string;
  score: number;
  streak: number;
  correctAnswersCount: number;
  hasAnsweredCurrentQ: boolean;
  lastAnswerOptionId?: string;
  lastAnswerScore?: number;
}

export interface RoomQuestionOptionSnapshot {
  optionId: string;
  content: string;
}

export interface RoomQuestionSnapshot {
  questionId: string;
  content: string;
  type: string;
  timeLimitSec: number;
  options: RoomQuestionOptionSnapshot[];
}

export interface RoomState {
  pin: string;
  quizId: string;
  quizVersion: number;
  quizTitle: string;
  organizationId: string;
  hostSocketId: string | null;
  hostUserId: string;
  phase: RoomPhase;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questions: RoomQuestionSnapshot[];
  players: Record<string, PlayerState>;
  createdAt: number;
}

export interface JoinRoomPayload {
  pin: string;
  nickname?: string;
  userId?: string | null;
  playerId?: string | null;
}

export interface RoomPinPayload {
  pin: string;
}

export interface SubmitAnswerPayload {
  pin: string;
  optionId: string;
}

export interface RoomCreatedResponse {
  pin: string;
}

export interface JoinedSuccessfullyResponse {
  room: RoomState;
}

export interface PlayerJoinedEvent {
  nickname: string;
  playersCount: number;
  players: Array<{ nickname: string; score: number }>;
}

export interface PlayerLeftEvent {
  socketId: string;
  playersCount: number;
}

export interface QuestionStartEvent {
  question?: RoomQuestionSnapshot;
  questionIndex?: number;
  totalQuestions?: number;
  startedAt?: number | null;
  leaderboard?: PlayerState[];
}

export interface AnswerResultResponse {
  isCorrect: boolean;
  scoreGained: number;
  totalScore: number;
  streak: number;
}

export interface AnswerSubmittedTickEvent {
  socketId: string;
  nickname: string;
  answeredCount: number;
  totalPlayers: number;
}

export interface QuestionRevealEvent {
  correctOptionIds: string[];
  stats: Record<string, number>;
  leaderboard?: PlayerState[];
}

export interface RoomEndedEvent {
  podium: PlayerState[];
}

export interface RoomClosedEvent {
  leaderboard: PlayerState[];
}

export interface RoomErrorResponse {
  message: string;
}

export interface RoomPublicStatusResponse {
  exists: boolean;
  phase?: RoomPhase;
  quizTitle?: string;
  playersCount?: number;
}

export interface LeaderboardResultEntry {
  rank: number;
  userId: string | null;
  nickname: string;
  score: number;
  correctAnswersCount: number;
}

export interface RoomResultItem {
  _id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  quizVersion: number;
  organizationId: string;
  hostUserId: string;
  totalQuestions: number;
  participantsCount: number;
  leaderboard: LeaderboardResultEntry[];
  endedAt?: string | null;
  createdAt: string;
}

export interface HostRoomsStatsResponse {
  totalRooms: number;
  liveRooms: number;
  totalCandidates: number;
  overallAccuracy: number | null;
}
