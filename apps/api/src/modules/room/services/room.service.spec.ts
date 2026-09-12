import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/utils/paginate.util';
import { QuizVersion } from '../../quiz/schemas/quiz-version.schema';
import { RoomResult } from '../schemas/room-result.schema';
import { RoomService } from './room.service';

jest.mock('../../../common/utils/paginate.util');

describe('RoomService', () => {
  let service: RoomService;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockQuizVersionModel: {
    findOne: jest.Mock;
  };
  let mockRoomResultModel: {
    updateOne: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    aggregate: jest.Mock;
  };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_host_123';
  const mockQuizId = new Types.ObjectId().toHexString();

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
      find: jest.fn(),
      findOne: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
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

    service = module.get<RoomService>(RoomService);
  });

  describe('createRoom', () => {
    it('throws BadRequestException if quiz has no published version', async () => {
      mockQuizVersionModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.createRoom(mockUserId, mockOrgId, mockQuizId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a room successfully and stores in cache', async () => {
      const qId = new Types.ObjectId();
      const optId = new Types.ObjectId();

      mockQuizVersionModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              version: 1,
              snapshot: {
                title: 'Math 12',
                timeLimitSec: 30,
                questions: [
                  {
                    _id: qId,
                    content: '1 + 1 = ?',
                    type: 'single_choice',
                    options: [{ _id: optId, content: '2', isCorrect: true }],
                  },
                ],
              },
            }),
          }),
        }),
      });

      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(undefined);

      const { pin } = await service.createRoom(mockUserId, mockOrgId, mockQuizId);

      expect(pin).toHaveLength(6);
      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });

    it('creates a room with specific quizVersion when specified', async () => {
      const qId = new Types.ObjectId();

      mockQuizVersionModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              version: 2,
              snapshot: {
                title: 'Math 12 v2',
                timeLimitSec: 45,
                questions: [{ _id: qId, content: '2 + 2 = ?', options: [] }],
              },
            }),
          }),
        }),
      });

      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(undefined);

      const { pin } = await service.createRoom(mockUserId, mockOrgId, mockQuizId, 2);

      expect(pin).toHaveLength(6);
      expect(mockQuizVersionModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2 }),
      );
    });
  });

  describe('getRoomPublicStatus', () => {
    it('returns exists: false if room not found in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const res = await service.getRoomPublicStatus('000000');
      expect(res.exists).toBe(false);
    });

    it('returns public details if room exists', async () => {
      mockCacheService.get.mockResolvedValue(
        JSON.stringify({
          phase: 'LOBBY',
          quizTitle: 'Test Quiz',
          players: { s1: {} },
        }),
      );
      const res = await service.getRoomPublicStatus('123456');
      expect(res.exists).toBe(true);
      expect(res.playersCount).toBe(1);
    });
  });

  describe('getHostRoomsHistory', () => {
    it('delegates to paginate util with host and org filter and allowed sort fields', async () => {
      const mockResult = {
        items: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      (paginate as jest.Mock).mockResolvedValue(mockResult);

      const query = new PaginationQueryDto();
      const result = await service.getHostRoomsHistory(mockUserId, mockOrgId, query);

      expect(paginate).toHaveBeenCalledWith(
        mockRoomResultModel,
        { hostUserId: mockUserId, organizationId: mockOrgId },
        query,
        { allowedSortFields: ['createdAt', 'participantsCount', 'totalQuestions'] },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStudentLiveHistory', () => {
    it('delegates to paginate util with leaderboard userId and org filter', async () => {
      const mockResult = {
        items: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      (paginate as jest.Mock).mockResolvedValue(mockResult);

      const query = new PaginationQueryDto();
      const result = await service.getStudentLiveHistory(mockUserId, mockOrgId, query);

      expect(paginate).toHaveBeenCalledWith(
        mockRoomResultModel,
        { 'leaderboard.userId': mockUserId, organizationId: mockOrgId },
        query,
        { allowedSortFields: ['createdAt', 'participantsCount', 'totalQuestions'] },
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('getHostRoomsStats', () => {
    it('returns calculated aggregate stats from mongodb aggregation', async () => {
      mockRoomResultModel.aggregate.mockResolvedValue([
        {
          totalRooms: 12,
          liveRooms: 2,
          totalCandidates: 150,
          totalCorrect: 300,
          totalPossible: 400,
        },
      ]);

      const result = await service.getHostRoomsStats(mockUserId, mockOrgId);

      expect(mockRoomResultModel.aggregate).toHaveBeenCalledWith([
        { $match: { hostUserId: mockUserId, organizationId: mockOrgId } },
        expect.any(Object),
      ]);
      expect(result).toEqual({
        totalRooms: 12,
        liveRooms: 2,
        totalCandidates: 150,
        overallAccuracy: 75,
      });
    });

    it('returns zero values and null accuracy when no rooms exist', async () => {
      mockRoomResultModel.aggregate.mockResolvedValue([]);

      const result = await service.getHostRoomsStats(mockUserId, mockOrgId);

      expect(result).toEqual({
        totalRooms: 0,
        liveRooms: 0,
        totalCandidates: 0,
        overallAccuracy: null,
      });
    });
  });

  describe('closeRoom', () => {
    it('throws NotFoundException if room does not exist', async () => {
      mockRoomResultModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.closeRoom('123456', mockUserId, mockOrgId)).rejects.toThrow();
    });

    it('throws BadRequestException if caller is not the host', async () => {
      mockRoomResultModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          pin: '123456',
          hostUserId: 'another_user',
          organizationId: mockOrgId,
          endedAt: null,
        }),
      });

      await expect(service.closeRoom('123456', mockUserId, mockOrgId)).rejects.toThrow();
    });

    it('successfully closes room and deletes cache', async () => {
      mockRoomResultModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          pin: '123456',
          hostUserId: mockUserId,
          organizationId: mockOrgId,
          endedAt: null,
          participantsCount: 0,
        }),
      });

      mockCacheService.get.mockResolvedValue(null);

      const result = await service.closeRoom('123456', mockUserId, mockOrgId);

      expect(result).toEqual({ success: true });
      expect(mockRoomResultModel.updateOne).toHaveBeenCalledWith(
        { pin: '123456' },
        expect.objectContaining({
          $set: expect.objectContaining({
            endedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockCacheService.del).toHaveBeenCalledWith('room:123456');
    });
  });

  describe('sweepExpiredRooms', () => {
    it('returns 0 when no active rooms found', async () => {
      mockRoomResultModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const count = await service.sweepExpiredRooms();
      expect(count).toBe(0);
    });

    it('finalizes rooms whose cache has expired or age exceeds TTL', async () => {
      const pastDate = new Date(Date.now() - 4 * 3600 * 1000); // 4 hours ago (> 3h TTL)
      mockRoomResultModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue([
                { _id: new Types.ObjectId(), pin: '111111', createdAt: pastDate },
              ]),
          }),
        }),
      });

      const count = await service.sweepExpiredRooms();
      expect(count).toBe(1);
      expect(mockRoomResultModel.updateOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({ endedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
