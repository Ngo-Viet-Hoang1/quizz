import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizVersionService } from './quiz-version.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { QueryQuizVersionDto } from './dto/query-quiz-version.dto';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from './enums';
import { ApiResponse } from '../../common/response/api-response';
import { IQuiz } from './interfaces/quiz.interface';
import { QuizVersion } from './schemas/quiz-version.schema';
import { Quiz } from './schemas/quiz.schema';
import { Types } from 'mongoose';

describe('QuizController', () => {
  let controller: QuizController;
  let quizService: jest.Mocked<QuizService>;
  let quizVersionService: jest.Mocked<QuizVersionService>;

  const mockOrgId = 'org_123';
  const mockUserId = 'user_abc';
  const mockQuizId = '507f1f77bcf86cd799439011';

  const mockQuiz: IQuiz = {
    _id: mockQuizId,
    organizationId: mockOrgId,
    ownerId: mockUserId,
    title: 'Test Quiz',
    status: QuizStatus.DRAFT,
    difficulty: QuizDifficulty.MEDIUM,
    sourceType: QuizSourceType.MANUAL,
    visibility: QuizVisibility.PRIVATE,
    version: 1,
    activeRoomCount: 0,
    questionCount: 0,
    questions: [],
  };

  const mockQuizVersion: QuizVersion = {
    _id: new Types.ObjectId(),
    quizId: new Types.ObjectId(mockQuizId),
    organizationId: mockOrgId,
    version: 1,
    snapshot: {
      title: 'Test Quiz',
      timeLimitSec: 600,
      questions: [],
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn().mockResolvedValue(mockQuiz as unknown as Quiz),
      findAll: jest.fn().mockResolvedValue({
        items: [mockQuiz],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findOne: jest.fn().mockResolvedValue(mockQuiz as unknown as Quiz),
      update: jest.fn().mockResolvedValue(mockQuiz as unknown as Quiz),
      publish: jest
        .fn()
        .mockResolvedValue({ ...mockQuiz, status: QuizStatus.PUBLISHED } as unknown as Quiz),
      archive: jest
        .fn()
        .mockResolvedValue({ ...mockQuiz, status: QuizStatus.ARCHIVED } as unknown as Quiz),
      clone: jest
        .fn()
        .mockResolvedValue({ ...mockQuiz, title: 'Test Quiz (Copy)' } as unknown as Quiz),
      share: jest
        .fn()
        .mockResolvedValue({ shareCode: 'abc12345', shareUrl: '/quizzes/shared/abc12345' }),
      remove: jest.fn().mockResolvedValue({ deleted: true, id: mockQuizId }),
    };

    const mockVersionService = {
      freezeSnapshot: jest.fn().mockResolvedValue(undefined),
      getVersions: jest.fn().mockResolvedValue({
        items: [mockQuizVersion],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      getVersionDetail: jest.fn().mockResolvedValue(mockQuizVersion),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useValue: mockService,
        },
        {
          provide: QuizVersionService,
          useValue: mockVersionService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuizController>(QuizController);
    quizService = module.get(QuizService);
    quizVersionService = module.get(QuizVersionService);
  });

  it('should create a quiz via service with orgId and userId', async () => {
    const dto: CreateQuizDto = { title: 'New Quiz' };
    const result = await controller.create(mockOrgId, mockUserId, dto);

    expect(quizService.create).toHaveBeenCalledWith(mockOrgId, mockUserId, dto);
    expect(result).toEqual(mockQuiz);
  });

  it('should findAll quizzes and wrap in ApiResponse.success', async () => {
    const query: QueryQuizDto = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
    const result = await controller.findAll(mockOrgId, query);

    expect(quizService.findAll).toHaveBeenCalledWith(mockOrgId, query);
    expect(result).toBeInstanceOf(ApiResponse);
    expect(result.data).toEqual([mockQuiz]);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('should getVersions for a quiz and wrap in ApiResponse.success', async () => {
    const query: QueryQuizVersionDto = { page: 1, limit: 10, sortBy: 'version', sortOrder: 'desc' };
    const result = await controller.getVersions(mockOrgId, mockQuizId, query);

    expect(quizService.findOne).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(quizVersionService.getVersions).toHaveBeenCalledWith(mockQuizId, mockOrgId, query);
    expect(result).toBeInstanceOf(ApiResponse);
    expect(result.data).toEqual([mockQuizVersion]);
  });

  it('should getVersionDetail for a specific quiz version', async () => {
    const result = await controller.getVersionDetail(mockOrgId, mockQuizId, 1);

    expect(quizService.findOne).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(quizVersionService.getVersionDetail).toHaveBeenCalledWith(mockQuizId, 1, mockOrgId);
    expect(result).toEqual(mockQuizVersion);
  });

  it('should findOne quiz by id and orgId', async () => {
    const result = await controller.findOne(mockOrgId, mockQuizId);
    expect(quizService.findOne).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(result).toEqual(mockQuiz);
  });

  it('should publish a quiz', async () => {
    const result = await controller.publish(mockOrgId, mockQuizId);
    expect(quizService.publish).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(result.status).toBe(QuizStatus.PUBLISHED);
  });

  it('should clone a quiz with new owner userId', async () => {
    const result = await controller.clone(mockOrgId, mockUserId, mockQuizId);
    expect(quizService.clone).toHaveBeenCalledWith(mockQuizId, mockOrgId, mockUserId);
    expect(result.title).toBe('Test Quiz (Copy)');
  });

  it('should share a quiz and return share code and URL', async () => {
    const result = await controller.share(mockOrgId, mockQuizId);
    expect(quizService.share).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(result).toEqual({ shareCode: 'abc12345', shareUrl: '/quizzes/shared/abc12345' });
  });

  it('should soft delete a quiz', async () => {
    const result = await controller.remove(mockOrgId, mockQuizId);
    expect(quizService.remove).toHaveBeenCalledWith(mockQuizId, mockOrgId);
    expect(result).toEqual({ deleted: true, id: mockQuizId });
  });
});
