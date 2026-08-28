import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { QuestionType, QuizDifficulty } from '../quiz/enums';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationService, EnqueueJobResponse } from './ai-generation.service';
import { EnqueueAiGenerationJobDto } from './dto';
import { AiGenerationJobStatus } from './enums';

describe('AiGenerationController', () => {
  let controller: AiGenerationController;
  let service: jest.Mocked<AiGenerationService>;

  beforeEach(async () => {
    service = {
      enqueueJob: jest.fn(),
      getJobById: jest.fn(),
    } as unknown as jest.Mocked<AiGenerationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiGenerationController],
      providers: [
        {
          provide: AiGenerationService,
          useValue: service,
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

    const mockResponse: EnqueueJobResponse = {
      jobId: 'job_mongo_123',
      status: AiGenerationJobStatus.PENDING,
    };

    service.enqueueJob.mockResolvedValue(mockResponse);

    const result = await controller.enqueue(orgId, userId, dto);

    expect(service.enqueueJob).toHaveBeenCalledWith(orgId, userId, dto);
    expect(result).toEqual(mockResponse);
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

    service.getJobById.mockResolvedValue(mockStatusResponse);

    const result = await controller.getJobStatus(orgId, jobId);

    expect(service.getJobById).toHaveBeenCalledWith(orgId, jobId);
    expect(result).toEqual(mockStatusResponse);
  });
});


