import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import { PlayerState, QuestionRevealEvent, RoomPhase, RoomState } from '@repo/shared-types';
import { Model, Types } from 'mongoose';
import { Question } from '../../quiz/schemas';
import { QuizVersion, QuizVersionDocument } from '../../quiz/schemas/quiz-version.schema';
import {
  NextQuestionResult,
  StartRoomResult,
  SubmitAnswerResult,
} from '../interfaces/room-service.interfaces';
import { RoomResult, RoomResultDocument } from '../schemas/room-result.schema';

@Injectable()
export class RoomGameplayService {
  private readonly ROOM_TTL_SEC = 3 * 3600;
  private readonly logger = new Logger(RoomGameplayService.name);

  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    @InjectModel(QuizVersion.name) private readonly quizVersionModel: Model<QuizVersionDocument>,
    @InjectModel(RoomResult.name) private readonly roomResultModel: Model<RoomResultDocument>,
  ) {}

  private getRoomKey = (pin: string): string => `room:${pin}`;

  async joinRoom(
    pin: string,
    socketId: string,
    nickname?: string,
    userId?: string | null,
    playerId?: string | null,
  ): Promise<RoomState> {
    const state = await this.getRoomState(pin);

    if (userId && userId === state.hostUserId) {
      state.hostSocketId = socketId;
      await this.saveRoomState(state);
      return state;
    }

    const trimmedNickname = nickname?.trim();
    if (!trimmedNickname) throw new BadRequestException('Nickname is required to join');

    // Check if this is the SAME player reconnecting (by socketId, playerId, or userId)
    const existingEntry = Object.entries(state.players).find(([sId, p]) => {
      if (sId === socketId) return true;
      if (playerId && p.playerId && p.playerId === playerId) return true;
      if (userId && p.userId && p.userId === userId) return true;
      return false;
    });

    if (existingEntry) {
      const [oldSocketId, existingPlayer] = existingEntry;
      if (oldSocketId !== socketId) {
        delete state.players[oldSocketId];
        state.players[socketId] = {
          ...existingPlayer,
          socketId,
          userId: userId ?? existingPlayer.userId,
          playerId: playerId ?? existingPlayer.playerId,
        };
        await this.saveRoomState(state);
      }
      return state;
    }

    // For brand new players, room must still be in LOBBY
    if (state.phase !== RoomPhase.LOBBY)
      throw new BadRequestException('Room has already started or ended');

    const nameExists = Object.values(state.players).some(
      (p) => p.nickname.toLowerCase() === trimmedNickname.toLowerCase(),
    );
    if (nameExists) throw new BadRequestException('Nickname is already taken in this room');

    state.players[socketId] = {
      socketId,
      userId: userId ?? null,
      playerId: playerId ?? null,
      nickname: trimmedNickname,
      score: 0,
      streak: 0,
      correctAnswersCount: 0,
      hasAnsweredCurrentQ: false,
    };

    await this.saveRoomState(state);
    return state;
  }

  async removePlayer(pin: string, socketId: string): Promise<RoomState | null> {
    const data = await this.cacheService.get<RoomState | string>(this.getRoomKey(pin));
    if (!data) return null;
    const state: RoomState = typeof data === 'string' ? JSON.parse(data) : data;
    if (!state.players || !state.players[socketId]) return null;

    // Only remove player if the room is still in LOBBY phase.
    // If game has started, retain player data so temporary disconnection/reconnection retains scores.
    if (state.phase === RoomPhase.LOBBY) {
      delete state.players[socketId];
      await this.saveRoomState(state);
      return state;
    }

    return null;
  }

  async startRoom(pin: string, hostSocketId: string): Promise<StartRoomResult> {
    const state = await this.getRoomState(pin);
    this.assertHost(state, hostSocketId, 'Only the host can start the room');

    if (state.questions.length === 0) throw new BadRequestException('Quiz contains no questions');

    state.phase = RoomPhase.QUESTION_ACTIVE;
    state.currentQuestionIndex = 0;
    state.questionStartedAt = Date.now();

    this.resetPlayersForNextQuestion(state);
    await this.saveRoomState(state);
    return { room: state, question: state.questions[0] };
  }

  async submitAnswer(pin: string, socketId: string, optionId: string): Promise<SubmitAnswerResult> {
    const state = await this.getRoomState(pin);
    if (state.phase !== RoomPhase.QUESTION_ACTIVE)
      throw new BadRequestException('Not currently accepting answers');

    const player = state.players[socketId];
    if (!player) throw new NotFoundException('Player not found in room');
    if (player.hasAnsweredCurrentQ)
      throw new BadRequestException('You have already answered this question');

    const currentQ = state.questions[state.currentQuestionIndex];
    if (!currentQ) throw new BadRequestException('Invalid question state');

    // Enforce deadline with a 2-second grace period for network drift
    const timeLimitSec = currentQ.timeLimitSec || 30;
    if (state.questionStartedAt) {
      const elapsedSec = (Date.now() - state.questionStartedAt) / 1000;
      if (elapsedSec > timeLimitSec + 2) {
        throw new BadRequestException('Time is up for this question');
      }
    }

    const originalQ = await this.getOriginalQuestion(state, currentQ.questionId);
    const correctOption = originalQ?.options?.find((opt) => opt.isCorrect);
    const isCorrect = correctOption ? String(correctOption._id) === optionId : false;

    player.hasAnsweredCurrentQ = true;
    player.lastAnswerOptionId = optionId;

    const answeredCount = Object.values(state.players).filter((p) => p.hasAnsweredCurrentQ).length;
    const totalPlayers = Object.keys(state.players).length;

    if (!isCorrect) {
      player.streak = 0;
      player.lastAnswerScore = 0;
      await this.saveRoomState(state);
      return {
        isCorrect: false,
        scoreGained: 0,
        totalScore: player.score,
        streak: 0,
        nickname: player.nickname,
        answeredCount,
        totalPlayers,
      };
    }

    const scoreGained = this.calculateScore(
      state.questionStartedAt,
      currentQ.timeLimitSec || 30,
      player.streak,
    );

    player.streak += 1;
    player.correctAnswersCount += 1;
    player.score += scoreGained;
    player.lastAnswerScore = scoreGained;

    await this.saveRoomState(state);

    return {
      isCorrect: true,
      scoreGained,
      totalScore: player.score,
      streak: player.streak,
      nickname: player.nickname,
      answeredCount,
      totalPlayers,
    };
  }

  async revealAnswers(pin: string, hostSocketId: string): Promise<QuestionRevealEvent> {
    const state = await this.getRoomState(pin);
    this.assertHost(state, hostSocketId);

    state.phase = RoomPhase.QUESTION_REVEAL;

    const currentQ = state.questions[state.currentQuestionIndex];
    const originalQ = await this.getOriginalQuestion(state, currentQ.questionId);
    const correctOptionIds = (originalQ?.options ?? [])
      .filter((opt) => opt.isCorrect)
      .map((opt) => String(opt._id));

    const stats: Record<string, number> = {};
    (currentQ?.options ?? []).forEach((opt) => {
      stats[opt.optionId] = 0;
    });
    Object.values(state.players).forEach((p) => {
      if (p.lastAnswerOptionId && stats[p.lastAnswerOptionId] !== undefined) {
        stats[p.lastAnswerOptionId] += 1;
      }
    });

    const leaderboard = this.getLeaderboard(state);

    await this.saveRoomState(state);
    return { correctOptionIds, stats, leaderboard };
  }

  async nextQuestion(pin: string, hostSocketId: string): Promise<NextQuestionResult> {
    const state = await this.getRoomState(pin);
    this.assertHost(state, hostSocketId);

    const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1;
    const leaderboard = this.getLeaderboard(state);

    if (isLastQuestion) {
      state.phase = RoomPhase.PODIUM;
      await this.saveRoomState(state);
      await this.persistRoomResults(state);
      await this.cacheService.del(this.getRoomKey(pin));
      return { nextPhase: RoomPhase.PODIUM, leaderboard };
    }

    state.currentQuestionIndex += 1;
    state.phase = RoomPhase.QUESTION_ACTIVE;
    state.questionStartedAt = Date.now();
    this.resetPlayersForNextQuestion(state);

    await this.saveRoomState(state);

    return {
      nextPhase: RoomPhase.QUESTION_ACTIVE,
      question: state.questions[state.currentQuestionIndex],
      questionIndex: state.currentQuestionIndex,
      totalQuestions: state.questions.length,
      startedAt: state.questionStartedAt,
      leaderboard,
    };
  }

  async endRoom(pin: string, hostSocketId: string): Promise<{ leaderboard: PlayerState[] }> {
    const state = await this.getRoomState(pin);
    this.assertHost(state, hostSocketId);

    state.phase = RoomPhase.PODIUM;
    const leaderboard = this.getLeaderboard(state);

    await this.persistRoomResults(state);
    await this.cacheService.del(this.getRoomKey(pin));

    return { leaderboard };
  }

  private async persistRoomResults(state: RoomState): Promise<void> {
    try {
      const leaderboard = Object.values(state.players)
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
          rank: idx + 1,
          socketId: p.socketId,
          userId: p.userId,
          nickname: p.nickname,
          score: p.score,
          streak: p.streak,
          correctAnswersCount: p.correctAnswersCount,
        }));

      await this.roomResultModel.updateOne(
        { pin: state.pin },
        {
          $set: {
            pin: state.pin,
            quizId: new Types.ObjectId(state.quizId),
            quizVersion: state.quizVersion,
            quizTitle: state.quizTitle,
            organizationId: state.organizationId,
            hostUserId: state.hostUserId,
            totalQuestions: state.questions.length,
            participantsCount: leaderboard.length,
            leaderboard,
            endedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (err) {
      this.logger.error(
        `Failed to persist room result for pin ${state.pin}: ${(err as Error).message}`,
      );
    }
  }

  private assertHost(
    state: RoomState,
    hostSocketId: string,
    message = 'Unauthorized operation',
  ): void {
    if (state.hostSocketId !== hostSocketId) throw new BadRequestException(message);
  }

  private resetPlayersForNextQuestion(state: RoomState): void {
    Object.values(state.players).forEach((p) => {
      p.hasAnsweredCurrentQ = false;
      delete p.lastAnswerOptionId;
      delete p.lastAnswerScore;
    });
  }

  private getLeaderboard(state: RoomState): PlayerState[] {
    return Object.values(state.players).sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    questionStartedAt: number | null,
    limitSec: number,
    streak: number,
  ): number {
    const elapsedSec = (Date.now() - (questionStartedAt ?? Date.now())) / 1000;
    const timeBonus = Math.round(Math.max(0, (limitSec - elapsedSec) / limitSec) * 500);
    const streakBonus = streak * 50;
    return 500 + timeBonus + streakBonus;
  }

  private async getOriginalQuestion(
    state: RoomState,
    questionId: string,
  ): Promise<Question | undefined> {
    const versionDoc = await this.quizVersionModel
      .findOne({
        quizId: new Types.ObjectId(state.quizId),
        organizationId: state.organizationId,
        version: state.quizVersion,
      })
      .lean()
      .exec();

    return versionDoc?.snapshot.questions.find((q) => String(q._id) === questionId);
  }

  private async getRoomState(pin: string): Promise<RoomState> {
    const data = await this.cacheService.get<RoomState | string>(this.getRoomKey(pin));
    if (!data) throw new NotFoundException('Room not found or has expired');
    const state: RoomState = typeof data === 'string' ? (JSON.parse(data) as RoomState) : data;
    return state;
  }

  private async saveRoomState(state: RoomState): Promise<void> {
    await this.cacheService.set(this.getRoomKey(state.pin), state, this.ROOM_TTL_SEC);
  }
}
