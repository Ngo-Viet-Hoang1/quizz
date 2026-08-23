import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { QuizStatus } from '../quiz/enums';
import { QuizService } from '../quiz/quiz.service';
import { Question } from '../quiz/schemas/quiz.schema';
import { QuestionType } from '../quiz/enums';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { RoomStatus } from './enums';
import { Room, RoomDocument } from './schemas/room.schema';
import { RoomAttempt, RoomAttemptDocument } from './schemas/room-attempt.schema';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  totalScore: number;
  correctCount: number;
  totalTimeTakenMs: number;
}

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(RoomAttempt.name) private readonly roomAttemptModel: Model<RoomAttemptDocument>,
    private readonly quizService: QuizService,
  ) {}

  // ─── POST /rooms ────────────────────────────────────────────────────────────

  async create(orgId: string, userId: string, dto: CreateRoomDto): Promise<Room> {
    const quiz = await this.quizService.findOne(dto.quizId, orgId);

    if (quiz.status !== QuizStatus.PUBLISHED) {
      throw new BadRequestException('Quiz must be published to create a room');
    }

    const roomCode = this.generateRoomCode();

    const room = new this.roomModel({
      organizationId: orgId,
      quizId: new Types.ObjectId(dto.quizId),
      hostId: userId,
      roomCode,
      status: RoomStatus.WAITING,
      participants: [],
      startedAt: null,
      endedAt: null,
    });

    const saved = await room.save();

    // Increment activeRoomCount on the quiz
    await this.roomModel.db
      .collection('quizzes')
      .updateOne({ _id: new Types.ObjectId(dto.quizId) }, { $inc: { activeRoomCount: 1 } });

    return saved;
  }

  // ─── GET /rooms/:roomId ─────────────────────────────────────────────────────

  async findOne(roomId: string, orgId: string): Promise<Room> {
    const room = await this.roomModel
      .findOne({ _id: roomId, organizationId: orgId })
      .lean<Room>()
      .exec();

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return room;
  }

  // ─── POST /rooms/:roomId/join ───────────────────────────────────────────────

  async join(roomId: string, orgId: string, userId: string, dto: JoinRoomDto): Promise<Room> {
    const room = await this.findOneDocument(roomId, orgId);

    if (room.status === RoomStatus.FINISHED) {
      throw new BadRequestException('Room is no longer active');
    }

    const existingParticipant = room.participants.find((p) => p.userId === userId && !p.leftAt);
    if (existingParticipant) {
      throw new BadRequestException('You have already joined this room');
    }

    const updated = await this.roomModel
      .findOneAndUpdate(
        { _id: roomId, organizationId: orgId },
        {
          $push: {
            participants: {
              userId,
              nickname: dto.nickname,
              joinedAt: new Date(),
              leftAt: null,
            },
          },
        },
        { new: true },
      )
      .lean<Room>()
      .exec();

    return updated!;
  }

  // ─── POST /rooms/:roomId/leave ──────────────────────────────────────────────

  async leave(roomId: string, orgId: string, userId: string): Promise<{ left: boolean }> {
    const room = await this.findOneDocument(roomId, orgId);

    const participant = room.participants.find((p) => p.userId === userId && !p.leftAt);
    if (!participant) {
      throw new BadRequestException('You are not a participant in this room');
    }

    await this.roomModel
      .updateOne(
        {
          _id: roomId,
          organizationId: orgId,
          'participants.userId': userId,
          'participants.leftAt': null,
        },
        { $set: { 'participants.$.leftAt': new Date() } },
      )
      .exec();

    return { left: true };
  }

  // ─── POST /rooms/:roomId/start ──────────────────────────────────────────────

  async start(roomId: string, orgId: string, userId: string): Promise<Room> {
    const room = await this.findOneDocument(roomId, orgId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can start the room');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room can only be started from waiting status');
    }

    const updated = await this.roomModel
      .findOneAndUpdate(
        { _id: roomId, organizationId: orgId },
        { status: RoomStatus.IN_PROGRESS, startedAt: new Date() },
        { new: true },
      )
      .lean<Room>()
      .exec();

    return updated!;
  }

  // ─── POST /rooms/:roomId/end ────────────────────────────────────────────────

  async end(roomId: string, orgId: string, userId: string): Promise<Room> {
    const room = await this.findOneDocument(roomId, orgId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can end the room');
    }

    if (room.status !== RoomStatus.IN_PROGRESS) {
      throw new BadRequestException('Room can only be ended while in progress');
    }

    const updated = await this.roomModel
      .findOneAndUpdate(
        { _id: roomId, organizationId: orgId },
        { status: RoomStatus.FINISHED, endedAt: new Date() },
        { new: true },
      )
      .lean<Room>()
      .exec();

    // Decrement activeRoomCount on the quiz
    await this.roomModel.db
      .collection('quizzes')
      .updateOne(
        { _id: room.quizId, activeRoomCount: { $gt: 0 } },
        { $inc: { activeRoomCount: -1 } },
      );

    return updated!;
  }

  // ─── POST /rooms/:roomId/attempt ────────────────────────────────────────────

  async submitAttempt(
    roomId: string,
    orgId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ): Promise<RoomAttempt> {
    const room = await this.findOneDocument(roomId, orgId);

    if (room.status !== RoomStatus.IN_PROGRESS) {
      throw new BadRequestException('Room is not in progress');
    }

    const activeParticipant = room.participants.find((p) => p.userId === userId && !p.leftAt);
    if (!activeParticipant) {
      throw new ForbiddenException('You must join the room first');
    }

    // Check if already answered
    const existing = await this.roomAttemptModel
      .findOne({
        roomId: new Types.ObjectId(roomId),
        userId,
        questionId: new Types.ObjectId(dto.questionId),
      })
      .lean()
      .exec();

    if (existing) {
      throw new BadRequestException('You have already answered this question');
    }

    // Load quiz to grade the answer
    const quiz = await this.quizService.findOne(room.quizId.toString(), orgId);

    const question = quiz.questions?.find((q) => q._id?.toString() === dto.questionId);
    if (!question) {
      throw new NotFoundException('Question not found in this quiz');
    }

    const { isCorrect, score } = this.gradeAnswer(question, dto);

    const attempt = new this.roomAttemptModel({
      roomId: new Types.ObjectId(roomId),
      userId,
      questionId: new Types.ObjectId(dto.questionId),
      selectedOptionIds: (dto.selectedOptionIds ?? []).map((id) => new Types.ObjectId(id)),
      answerText: dto.answerText ?? null,
      isCorrect,
      score,
      answeredAt: new Date(),
      timeTakenMs: dto.timeTakenMs,
    });

    return attempt.save();
  }

  // ─── GET /rooms/:roomId/leaderboard ─────────────────────────────────────────

  async getLeaderboard(roomId: string, orgId: string): Promise<LeaderboardEntry[]> {
    // Verify room exists and belongs to org
    await this.findOne(roomId, orgId);

    const aggregation = await this.roomAttemptModel
      .aggregate([
        { $match: { roomId: new Types.ObjectId(roomId) } },
        {
          $group: {
            _id: '$userId',
            totalScore: { $sum: '$score' },
            correctCount: {
              $sum: { $cond: ['$isCorrect', 1, 0] },
            },
            totalTimeTakenMs: { $sum: '$timeTakenMs' },
          },
        },
        {
          $sort: { totalScore: -1, totalTimeTakenMs: 1 },
        },
      ])
      .exec();

    // Load room to get participant nicknames
    const room = await this.roomModel.findById(roomId).lean<Room>().exec();

    const nicknameMap = new Map<string, string>();
    for (const p of room?.participants ?? []) {
      nicknameMap.set(p.userId, p.nickname);
    }

    return aggregation.map(
      (
        entry: { _id: string; totalScore: number; correctCount: number; totalTimeTakenMs: number },
        idx: number,
      ) => ({
        rank: idx + 1,
        userId: entry._id,
        nickname: nicknameMap.get(entry._id) ?? 'Unknown',
        totalScore: entry.totalScore,
        correctCount: entry.correctCount,
        totalTimeTakenMs: entry.totalTimeTakenMs,
      }),
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findOneDocument(roomId: string, orgId: string): Promise<RoomDocument> {
    const room = await this.roomModel.findOne({ _id: roomId, organizationId: orgId }).exec();

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return room;
  }

  private gradeAnswer(
    question: Question,
    dto: SubmitAttemptDto,
  ): { isCorrect: boolean; score: number } {
    const points = question.points ?? 1;
    let isCorrect = false;

    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.TRUE_FALSE: {
        const correctOption = question.options?.find((opt) => opt.isCorrect === true);
        isCorrect =
          !!correctOption &&
          dto.selectedOptionIds?.length === 1 &&
          dto.selectedOptionIds[0] === correctOption._id?.toString();
        break;
      }

      case QuestionType.MULTIPLE_CHOICE: {
        const correctIds = new Set(
          question.options
            ?.filter((opt) => opt.isCorrect === true)
            .map((opt) => opt._id?.toString()) ?? [],
        );
        const selectedIds = new Set(dto.selectedOptionIds ?? []);

        isCorrect =
          correctIds.size === selectedIds.size &&
          [...correctIds].every((id) => id !== undefined && selectedIds.has(id));
        break;
      }

      case QuestionType.FILL_BLANK: {
        const correctText = question.metadata?.correctText?.trim().toLowerCase();
        const answerText = dto.answerText?.trim().toLowerCase();
        isCorrect = !!correctText && correctText === answerText;
        break;
      }

      case QuestionType.ORDERING: {
        const correctOrder = question.metadata?.correctOrder?.map((id) => id.toString());

        if (correctOrder && correctOrder.length > 0) {
          const selected = dto.selectedOptionIds ?? [];
          isCorrect =
            selected.length === correctOrder.length &&
            selected.every((id, idx) => id === correctOrder[idx]);
        } else {
          // Fallback: use options' orderIndex as correct order
          const sorted = [...(question.options ?? [])]
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((opt) => opt._id?.toString());

          const selected = dto.selectedOptionIds ?? [];
          isCorrect =
            selected.length === sorted.length && selected.every((id, idx) => id === sorted[idx]);
        }
        break;
      }

      default:
        isCorrect = false;
    }

    return { isCorrect, score: isCorrect ? points : 0 };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }
}
