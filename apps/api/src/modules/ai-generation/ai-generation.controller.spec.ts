import { Test, TestingModule } from '@nestjs/testing';
import { PaginateResult } from '../../common/utils/paginate.util';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { QuestionType, QuizDifficulty } from '../quiz/enums';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationService } from './ai-generation.service';
import { EnqueueAiGenerationJobDto, EnqueueJobResponseDto } from './dto';
import { AiGenerationJobStatus } from './enums';
import { AiGenerationJob } from './schemas';

describe('AiGenerationController', () => {
  let controller: AiGenerationController;
  let mockAiGenerationService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAiGenerationService = {
      enqueueJob: jest.fn(),
      getJobById: jest.fn(),
      getJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiGenerationController],
      providers: [
        {
          provide: AiGenerationService,
          useValue: mockAiGenerationService,
        },
      ],
    })

      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AiGenerationController>(AiGenerationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call aiGenerationService.enqueueJob and return response', async () => {
    const orgId = 'org_abc_1';
    const userId = 'user_xyz_1';
    const dto: EnqueueAiGenerationJobDto = {
      idempotencyKey: 'idemp-key-test',
      topic: 'World History',
      questionCount: 5,
      questionType: QuestionType.SINGLE_CHOICE,
      difficulty: QuizDifficulty.MEDIUM,
    };

    const mockResponse: EnqueueJobResponseDto = {
      jobId: 'job_mongo_123',
      status: AiGenerationJobStatus.PENDING,
    };

    mockAiGenerationService.enqueueJob.mockResolvedValue(mockResponse);

    const result = await controller.enqueue(orgId, userId, dto);

    expect(mockAiGenerationService.enqueueJob).toHaveBeenCalledWith(orgId, userId, dto);
    expect(result).toEqual(mockResponse);
  });

  it('should call aiGenerationService.getJobs and return paginated list of jobs', async () => {
    const orgId = 'org_abc_1';
    const mockJobsResponse: PaginateResult<AiGenerationJob> = {
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };

    mockAiGenerationService.getJobs.mockResolvedValue(mockJobsResponse);

    const query = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' as const };
    const result = await controller.getJobs(orgId, query);

    expect(mockAiGenerationService.getJobs).toHaveBeenCalledWith(orgId, query);
    expect(result).toEqual(mockJobsResponse);
  });

  it('should call aiGenerationService.getJobById and return job status', async () => {
    const orgId = 'org_abc_1';
    const jobId = '6a8ede91fee7891010d1d5e3';
    const mockStatusResponse = {
      jobId,
      status: AiGenerationJobStatus.COMPLETED,
      quizId: '6a8ede91fee7891010d1d5e4',
      errorMessage: null,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    mockAiGenerationService.getJobById.mockResolvedValue(mockStatusResponse);

    const result = await controller.getJobStatus(orgId, jobId);

    expect(mockAiGenerationService.getJobById).toHaveBeenCalledWith(orgId, jobId);
    expect(result).toEqual(mockStatusResponse);
  });
});
