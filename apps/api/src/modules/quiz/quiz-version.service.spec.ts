import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QuizVersionService } from './quiz-version.service';
import { QuizVersion } from './schemas/quiz-version.schema';
import { Quiz } from './schemas/quiz.schema';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from './enums';

type MockQuizVersionModel = {
  updateOne: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  countDocuments: jest.Mock;
};

describe('QuizVersionService', () => {
  let service: QuizVersionService;
  let mockQuizVersionModel: MockQuizVersionModel;

  const mockOrgId = 'org_123';
  const mockQuizId = new Types.ObjectId().toHexString();

  const mockQuiz: Quiz = {
    _id: new Types.ObjectId(mockQuizId),
    organizationId: mockOrgId,
    ownerId: 'user_1',
    title: 'Sample Quiz',
    difficulty: QuizDifficulty.MEDIUM,
    sourceType: QuizSourceType.MANUAL,
    visibility: QuizVisibility.PRIVATE,
    status: QuizStatus.PUBLISHED,
    version: 1,
    activeRoomCount: 0,
    questions: [],
    questionCount: 0,
  };

  const mockVersionDoc = {
    _id: new Types.ObjectId(),
    quizId: new Types.ObjectId(mockQuizId),
    organizationId: mockOrgId,
    version: 1,
    snapshot: {
      title: 'Sample Quiz',
      timeLimitSec: 600,
      questions: [],
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockQuizVersionModel = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockVersionDoc]),
              }),
            }),
          }),
        }),
      }),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizVersionService,
        {
          provide: getModelToken(QuizVersion.name),
          useValue: mockQuizVersionModel,
        },
      ],
    }).compile();

    service = module.get<QuizVersionService>(QuizVersionService);
  });

  describe('freezeSnapshot', () => {
    it('should upsert quiz snapshot in quiz_versions collection', async () => {
      await service.freezeSnapshot(mockQuiz, 1);

      expect(mockQuizVersionModel.updateOne).toHaveBeenCalledWith(
        { quizId: new Types.ObjectId(mockQuizId), version: 1 },
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            quizId: new Types.ObjectId(mockQuizId),
            organizationId: mockOrgId,
            version: 1,
            snapshot: expect.objectContaining({ title: 'Sample Quiz' }),
          }),
        }),
        { upsert: true },
      );
    });
  });

  describe('getVersions', () => {
    it('should return paginated versions for a quiz', async () => {
      const result = await service.getVersions(mockQuizId, mockOrgId, {
        page: 1,
        limit: 10,
        sortBy: 'version',
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockQuizVersionModel.find).toHaveBeenCalledWith(
        {
          quizId: new Types.ObjectId(mockQuizId),
          organizationId: mockOrgId,
        },
        undefined,
      );
    });
  });

  describe('getVersionDetail', () => {
    it('should return version detail when found', async () => {
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockVersionDoc),
        }),
      });

      const result = await service.getVersionDetail(mockQuizId, 1, mockOrgId);

      expect(result.version).toBe(1);
      expect(mockQuizVersionModel.findOne).toHaveBeenCalledWith({
        quizId: new Types.ObjectId(mockQuizId),
        organizationId: mockOrgId,
        version: 1,
      });
    });

    it('should throw NotFoundException when version is not found', async () => {
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getVersionDetail(mockQuizId, 99, mockOrgId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
