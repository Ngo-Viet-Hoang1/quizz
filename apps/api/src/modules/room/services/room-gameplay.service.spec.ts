import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import { RoomPhase, RoomState } from '@repo/shared-types';
import { RoomGameplayService } from './room-gameplay.service';
import { RoomResult } from '../schemas/room-result.schema';
import { QuizVersion } from '../../quiz/schemas/quiz-version.schema';

describe('RoomGameplayService', () => {
  let service: RoomGameplayService;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockQuizVersionModel: {
    findOne: jest.Mock;
  };
  let mockRoomResultModel: {
    updateOne: jest.Mock;
  };

  const mockHostUserId = 'host_user_1';
  const mockHostSocketId = 'socket_host_1';
  const mockPin = '123456';
  const q1Id = new Types.ObjectId();
  const opt1Id = new Types.ObjectId();
  const opt2Id = new Types.ObjectId();

  const createMockRoomState = (phase = RoomPhase.LOBBY): RoomState => ({
    pin: mockPin,
    quizId: new Types.ObjectId().toHexString(),
    quizVersion: 1,
    quizTitle: 'Live Quiz Test',
    organizationId: 'org_1',
    hostSocketId: mockHostSocketId,
    hostUserId: mockHostUserId,
    phase,
    currentQuestionIndex: -1,
    questionStartedAt: null,
    questions: [
      {
        questionId: q1Id.toHexString(),
        content: 'What is 2+2?',
        type: 'single_choice',
        timeLimitSec: 30,
        options: [
          { optionId: opt1Id.toHexString(), content: '4' },
          { optionId: opt2Id.toHexString(), content: '5' },
        ],
      },
    ],
    players: {},
    createdAt: Date.now(),
  });

  beforeEach(async () => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    mockQuizVersionModel = {
      findOne: jest.fn(),
    };

    mockRoomResultModel = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGameplayService,
        {
          provide: CACHE_SERVICE,
          useValue: mockCacheService,
        },
        {
          provide: getModelToken(QuizVersion.name),
          useValue: mockQuizVersionModel,
        },
        {
          provide: getModelToken(RoomResult.name),
          useValue: mockRoomResultModel,
        },
      ],
    }).compile();

    service = module.get<RoomGameplayService>(RoomGameplayService);
  });

  describe('joinRoom', () => {
    it('throws NotFoundException if room does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await expect(service.joinRoom('999999', 'socket_player', 'Student A', null)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if room is not in LOBBY phase for student', async () => {
      const state = createMockRoomState(RoomPhase.QUESTION_ACTIVE);
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));

      await expect(service.joinRoom(mockPin, 'socket_player', 'Student A', null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if nickname is taken', async () => {
      const state = createMockRoomState();
      state.players['socket_existing'] = {
        socketId: 'socket_existing',
        userId: null,
        nickname: 'Alex',
        score: 0,
        streak: 0,
        correctAnswersCount: 0,
        hasAnsweredCurrentQ: false,
      };
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));

      await expect(service.joinRoom(mockPin, 'socket_new', 'alex', null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('adds student to players map in LOBBY phase', async () => {
      const state = createMockRoomState();
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));
      mockCacheService.set.mockResolvedValue(undefined);

      const updated = await service.joinRoom(mockPin, 'socket_player', 'Bob', 'user_student');

      expect(updated.players['socket_player']).toBeDefined();
      expect(updated.players['socket_player'].nickname).toBe('Bob');
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('reconnects host and binds hostSocketId without adding to players map', async () => {
      const state = createMockRoomState(RoomPhase.QUESTION_ACTIVE);
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));
      mockCacheService.set.mockResolvedValue(undefined);

      const updated = await service.joinRoom(mockPin, 'socket_host_new', undefined, mockHostUserId);

      expect(updated.hostSocketId).toBe('socket_host_new');
      expect(updated.players['socket_host_new']).toBeUndefined();
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('removePlayer', () => {
    it('removes player from players map if exists', async () => {
      const state = createMockRoomState();
      state.players['socket_player'] = {
        socketId: 'socket_player',
        userId: null,
        nickname: 'Bob',
        score: 0,
        streak: 0,
        correctAnswersCount: 0,
        hasAnsweredCurrentQ: false,
      };
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));
      mockCacheService.set.mockResolvedValue(undefined);

      const updated = await service.removePlayer(mockPin, 'socket_player');
      expect(updated?.players['socket_player']).toBeUndefined();
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('returns null if socket was not in players map (e.g. host disconnect)', async () => {
      const state = createMockRoomState();
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));

      const updated = await service.removePlayer(mockPin, mockHostSocketId);
      expect(updated).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('startRoom', () => {
    it('throws BadRequestException if caller is not the host', async () => {
      const state = createMockRoomState();
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));

      await expect(service.startRoom(mockPin, 'socket_impostor')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('starts question 1 and updates phase to QUESTION_ACTIVE', async () => {
      const state = createMockRoomState();
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));
      mockCacheService.set.mockResolvedValue(undefined);

      const res = await service.startRoom(mockPin, mockHostSocketId);

      expect(res.room.phase).toBe(RoomPhase.QUESTION_ACTIVE);
      expect(res.room.currentQuestionIndex).toBe(0);
      expect(res.question.questionId).toBe(q1Id.toHexString());
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('submitAnswer', () => {
    it('evaluates correct answer, calculates score, and increments streak', async () => {
      const state = createMockRoomState(RoomPhase.QUESTION_ACTIVE);
      state.currentQuestionIndex = 0;
      state.questionStartedAt = Date.now();
      state.players['socket_student'] = {
        socketId: 'socket_student',
        userId: 'u_1',
        nickname: 'Alice',
        score: 0,
        streak: 0,
        correctAnswersCount: 0,
        hasAnsweredCurrentQ: false,
      };
      mockCacheService.get.mockResolvedValue(JSON.stringify(state));
      mockCacheService.set.mockResolvedValue(undefined);

      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            snapshot: {
              questions: [
                {
                  _id: q1Id,
                  options: [
                    { _id: opt1Id, content: '4', isCorrect: true },
                    { _id: opt2Id, content: '5', isCorrect: false },
                  ],
                },
              ],
            },
          }),
        }),
      });

      const res = await service.submitAnswer(mockPin, 'socket_student', opt1Id.toHexString());

      expect(res.isCorrect).toBe(true);
      expect(res.scoreGained).toBeGreaterThan(0);
      expect(res.streak).toBe(1);
      expect(res.totalScore).toBe(res.scoreGained);
    });
  });
});
