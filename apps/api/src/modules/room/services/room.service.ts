import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import {
  HostRoomsStatsResponse,
  PlayerState,
  RoomCreatedResponse,
  RoomPhase,
  RoomPublicStatusResponse,
  RoomQuestionSnapshot,
  RoomState,
} from '@repo/shared-types';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate, PaginateResult } from '../../../common/utils/paginate.util';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { QuizVersion, QuizVersionDocument } from '../../quiz/schemas/quiz-version.schema';
import { QuizVersionService } from '../../quiz/quiz-version.service';
import { RoomGateway } from '../room.gateway';
import { LeaderboardEntry, RoomResult, RoomResultDocument } from '../schemas/room-result.schema';

const ROOM_RESULT_SORT_FIELDS = ['createdAt', 'participantsCount', 'totalQuestions'] as const;

@Injectable()
export class RoomService {
  private readonly ROOM_TTL_SEC = 3 * 3600;

  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    @InjectModel(QuizVersion.name) private readonly quizVersionModel: Model<QuizVersionDocument>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(RoomResult.name) private readonly roomResultModel: Model<RoomResultDocument>,
    private readonly quizVersionService: QuizVersionService,
    @Inject(forwardRef(() => RoomGateway))
    @Optional()
    private readonly roomGateway?: RoomGateway,
  ) {}

  private getRoomKey = (pin: string): string => `room:${pin}`;
  private generatePin = (): string => Math.floor(100000 + Math.random() * 900000).toString();

  async createRoom(
    hostUserId: string,
    orgId: string,
    quizId: string,
    quizVersion?: number,
    timeLimitSec?: number,
  ): Promise<RoomCreatedResponse> {
    const query: { quizId: Types.ObjectId; organizationId: string; version?: number } = {
      quizId: new Types.ObjectId(quizId),
      organizationId: orgId,
    };
    if (quizVersion) {
      query.version = quizVersion;
    }

    let targetVersion = await this.quizVersionModel
      .findOne(query)
      .sort({ version: -1 })
      .lean()
      .exec();

    // If no snapshot exists yet (e.g. Draft quiz), automatically freeze a snapshot version 1
    if (!targetVersion) {
      if (quizVersion) {
        throw new BadRequestException(
          `Quiz version ${quizVersion} does not exist or is not published`,
        );
      }

      const quizDoc = await this.quizModel
        .findOne({
          _id: new Types.ObjectId(quizId),
          organizationId: orgId,
          deletedAt: null,
        })
        .lean<Quiz>()
        .exec();

      if (!quizDoc) {
        throw new NotFoundException(`Quiz with ID ${quizId} not found`);
      }

      if (!quizDoc.questions || quizDoc.questions.length === 0) {
        throw new BadRequestException('Quiz has no questions to host a live room');
      }

      const versionToFreeze = quizDoc.version || 1;
      await this.quizVersionService.freezeSnapshot(quizDoc, versionToFreeze);

      targetVersion = await this.quizVersionModel
        .findOne({
          quizId: new Types.ObjectId(quizId),
          organizationId: orgId,
          version: versionToFreeze,
        })
        .lean()
        .exec();
    }

    if (!targetVersion) {
      throw new BadRequestException('Failed to initialize live room quiz snapshot');
    }

    let pin = this.generatePin();
    while (await this.cacheService.get(this.getRoomKey(pin))) {
      pin = this.generatePin();
    }

    const defaultTimeLimit = targetVersion.snapshot.timeLimitSec ?? 30;
    const effectiveTimeLimit = timeLimitSec && timeLimitSec >= 5 ? timeLimitSec : defaultTimeLimit;

    // Strip isCorrect from options to guarantee client-side exam integrity
    const safeQuestions: RoomQuestionSnapshot[] = targetVersion.snapshot.questions.map((q) => ({
      questionId: String(q._id),
      content: q.content,
      type: q.type,
      timeLimitSec: effectiveTimeLimit,
      options: (q.options ?? []).map((opt) => ({
        optionId: String(opt._id),
        content: opt.content,
      })),
    }));

    const state: RoomState = {
      pin,
      quizId,
      quizVersion: targetVersion.version,
      quizTitle: targetVersion.snapshot.title,
      organizationId: orgId,
      hostSocketId: null,
      hostUserId,
      phase: RoomPhase.LOBBY,
      currentQuestionIndex: -1,
      questionStartedAt: null,
      questions: safeQuestions,
      players: {},
      createdAt: Date.now(),
    };

    await this.cacheService.set(this.getRoomKey(pin), state, this.ROOM_TTL_SEC);

    // Persist active room in MongoDB immediately so it appears on dashboard & history
    await this.roomResultModel.updateOne(
      { pin },
      {
        $set: {
          pin,
          quizId: new Types.ObjectId(quizId),
          quizVersion: targetVersion.version,
          quizTitle: targetVersion.snapshot.title,
          organizationId: orgId,
          hostUserId,
          totalQuestions: safeQuestions.length,
          participantsCount: 0,
          leaderboard: [],
        },
      },
      { upsert: true },
    );

    return { pin };
  }

  async getRoomPublicStatus(pin: string): Promise<RoomPublicStatusResponse> {
    const data = await this.cacheService.get<RoomState | string>(this.getRoomKey(pin));
    if (!data) return { exists: false };
    const state: RoomState = typeof data === 'string' ? (JSON.parse(data) as RoomState) : data;
    return {
      exists: true,
      phase: state.phase,
      quizTitle: state.quizTitle,
      playersCount: Object.keys(state.players || {}).length,
    };
  }

  async getHostRoomsHistory(
    hostUserId: string,
    orgId: string,
    query: PaginationQueryDto = new PaginationQueryDto(),
  ): Promise<PaginateResult<RoomResult>> {
    return paginate<RoomResult, RoomResultDocument>(
      this.roomResultModel,
      { hostUserId, organizationId: orgId },
      query,
      { allowedSortFields: ROOM_RESULT_SORT_FIELDS },
    );
  }

  async sweepExpiredRooms(): Promise<number> {
    const activeRooms = await this.roomResultModel
      .find({ endedAt: null })
      .select('_id pin createdAt')
      .lean()
      .exec();

    if (!activeRooms || activeRooms.length === 0) return 0;

    let finalizedCount = 0;
    const now = Date.now();
    const maxTtlMs = this.ROOM_TTL_SEC * 1000;

    for (const room of activeRooms) {
      const isPastTtl = now - new Date(room.createdAt).getTime() > maxTtlMs;
      let shouldFinalize = isPastTtl;

      if (!shouldFinalize) {
        const inRedis = await this.cacheService.get(this.getRoomKey(room.pin));
        if (!inRedis) {
          shouldFinalize = true;
        }
      }

      if (shouldFinalize) {
        await this.roomResultModel.updateOne({ _id: room._id }, { $set: { endedAt: new Date() } });
        finalizedCount++;
      }
    }

    return finalizedCount;
  }

  async getStudentLiveHistory(
    userId: string,
    orgId: string,
    query: PaginationQueryDto = new PaginationQueryDto(),
  ): Promise<PaginateResult<RoomResult>> {
    return paginate<RoomResult, RoomResultDocument>(
      this.roomResultModel,
      { 'leaderboard.userId': userId, organizationId: orgId },
      query,
      { allowedSortFields: ROOM_RESULT_SORT_FIELDS },
    );
  }

  async getHostRoomsStats(hostUserId: string, orgId: string): Promise<HostRoomsStatsResponse> {
    const stats = await this.roomResultModel.aggregate<{
      totalRooms: number;
      liveRooms: number;
      totalCandidates: number;
      totalCorrect: number;
      totalPossible: number;
    }>([
      { $match: { hostUserId, organizationId: orgId } },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          liveRooms: {
            $sum: {
              $cond: [{ $ifNull: ['$endedAt', false] }, 0, 1],
            },
          },
          totalCandidates: { $sum: '$participantsCount' },
          totalCorrect: {
            $sum: {
              $reduce: {
                input: { $ifNull: ['$leaderboard', []] },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.correctAnswersCount', 0] }] },
              },
            },
          },
          totalPossible: {
            $sum: {
              $multiply: [
                { $ifNull: ['$totalQuestions', 0] },
                { $size: { $ifNull: ['$leaderboard', []] } },
              ],
            },
          },
        },
      },
    ]);

    const data = stats[0];
    if (!data) {
      return {
        totalRooms: 0,
        liveRooms: 0,
        totalCandidates: 0,
        overallAccuracy: null,
      };
    }

    const overallAccuracy =
      data.totalPossible > 0 ? Math.round((data.totalCorrect / data.totalPossible) * 100) : null;

    return {
      totalRooms: data.totalRooms || 0,
      liveRooms: data.liveRooms || 0,
      totalCandidates: data.totalCandidates || 0,
      overallAccuracy,
    };
  }

  async closeRoom(
    pin: string,
    hostUserId: string,
    orgId: string,
  ): Promise<{ success: boolean; message?: string }> {
    const room = await this.roomResultModel.findOne({ pin, organizationId: orgId }).exec();
    if (!room) throw new NotFoundException(`Room with PIN ${pin} not found`);
    if (room.hostUserId !== hostUserId)
      throw new BadRequestException('You are not authorized to close this room');
    if (room.endedAt) return { success: true, message: 'Room has already ended' };

    const cacheKey = this.getRoomKey(pin);
    const data = await this.cacheService.get<RoomState | string>(cacheKey);

    let leaderboardEntries: LeaderboardEntry[] = [];
    let playerStates: PlayerState[] = [];

    if (data) {
      const state: RoomState = typeof data === 'string' ? (JSON.parse(data) as RoomState) : data;
      playerStates = Object.values(state.players || {}).sort((a, b) => b.score - a.score);
      leaderboardEntries = playerStates.map((p, idx) => ({
        rank: idx + 1,
        userId: p.userId,
        nickname: p.nickname,
        score: p.score,
        correctAnswersCount: p.correctAnswersCount,
      }));
    }

    await this.roomResultModel.updateOne(
      { pin },
      {
        $set: {
          endedAt: new Date(),
          participantsCount:
            leaderboardEntries.length > 0 ? leaderboardEntries.length : room.participantsCount,
          ...(leaderboardEntries.length > 0 ? { leaderboard: leaderboardEntries } : {}),
        },
      },
    );

    await this.cacheService.del(cacheKey);

    if (this.roomGateway) {
      this.roomGateway.broadcastRoomClosed(pin, playerStates);
    }

    return { success: true };
  }
}
