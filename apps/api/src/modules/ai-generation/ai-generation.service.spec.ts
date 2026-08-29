import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/utils/paginate.util';
import { QuestionType, QuizDifficulty } from '../quiz/enums';
import { BullMqJobPublisher } from '@/queue/bullmq-job-publisher';
import { JOB_NAMES } from '@/queue/queue.constants';
import { AiGenerationService } from './ai-generation.service';
import { EnqueueAiGenerationJobDto } from './dto';
import { AiGenerationJobStatus, SupportedAiModel } from './enums';
import { AiGenerationJob } from './schemas';
import { AiGenerationQuotaService } from './services/ai-generation-quota.service';

jest.mock('../../common/utils/paginate.util');

type MockJobInstance = {
  _id: Types.ObjectId;
  organizationId: string;
  userId: string;
  idempotencyKey: string;
  prompt: string;
  questionCount: number;
  model: string;
  status: AiGenerationJobStatus;
  save: jest.Mock;
};

type MockJobModel = jest.Mock & {
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  deleteOne: jest.Mock;
  updateOne: jest.Mock;
};

describe('AiGenerationService - enqueueJob', () => {
  let service: AiGenerationService;
  let jobModel: MockJobModel;
  let quotaService: jest.Mocked<AiGenerationQuotaService>;
  let jobPublisher: jest.Mocked<BullMqJobPublisher>;
  let mockJobInstance: MockJobInstance;

  const orgId = 'org_test_123';
  const userId = 'user_test_456';
  const dto: EnqueueAiGenerationJobDto = {
    idempotencyKey: 'idemp-key-1',
    topic: 'TypeScript Advanced',
    questionCount: 5,
    questionType: QuestionType.SINGLE_CHOICE,
    difficulty: QuizDifficulty.MEDIUM,
    model: SupportedAiModel.CLAUDE_3_5_HAIKU,
  };

  beforeEach(async () => {
    mockJobInstance = {
      _id: new Types.ObjectId(),
      organizationId: orgId,
      userId,
      idempotencyKey: dto.idempotencyKey,
      prompt: '',
      questionCount: dto.questionCount,
      model: dto.model ?? SupportedAiModel.CLAUDE_3_5_HAIKU,
      status: AiGenerationJobStatus.PENDING,
      save: jest.fn().mockImplementation(function (this: MockJobInstance) {
        return Promise.resolve(this);
      }),
    };

    const mockConstructor = jest.fn().mockImplementation(() => mockJobInstance);
    jobModel = Object.assign(mockConstructor, {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    quotaService = {
      deductQuota: jest.fn(),
      refundQuota: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AiGenerationQuotaService>;

    jobPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BullMqJobPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerationService,
        {
          provide: getModelToken(AiGenerationJob.name),
          useValue: jobModel,
        },
        {
          provide: BullMqJobPublisher,
          useValue: jobPublisher,
        },
        {
          provide: AiGenerationQuotaService,
          useValue: quotaService,
        },
      ],
    }).compile();

    service = module.get<AiGenerationService>(AiGenerationService);
  });

  it('should successfully create doc, deduct quota atomic, push to BullMQ and return pending status', async () => {
    const createdId = new Types.ObjectId();
    mockJobInstance._id = createdId;
    mockJobInstance.save.mockResolvedValue(mockJobInstance);

    quotaService.deductQuota.mockResolvedValue({
      _id: orgId,
      aiQuotaMonthly: 100,
      aiQuotaUsed: 1,
    } as never);

    const result = await service.enqueueJob(orgId, userId, dto);

    // 1. Verify doc was inserted first
    expect(jobModel).toHaveBeenCalledWith({
      organizationId: orgId,
      userId,
      idempotencyKey: dto.idempotencyKey,
      prompt:
        'Generate 5 single_choice quiz questions on topic: "TypeScript Advanced". Difficulty: medium.',
      questionCount: dto.questionCount,
      model: 'claude-3-5-haiku-20241022',
      status: AiGenerationJobStatus.PENDING,
    });
    expect(mockJobInstance.save).toHaveBeenCalledTimes(1);

    // 2. Verify atomic quota deduction via QuotaService
    expect(quotaService.deductQuota).toHaveBeenCalledWith(orgId);

    // 3. Verify pushed to BullMQ
    expect(jobPublisher.publish).toHaveBeenCalledWith(
      JOB_NAMES.GENERATE_QUIZ,
      {
        jobId: createdId.toString(),
        organizationId: orgId,
        userId,
        topic: dto.topic,
        questionCount: dto.questionCount,
        questionType: QuestionType.SINGLE_CHOICE,
        difficulty: QuizDifficulty.MEDIUM,
        prompt:
          'Generate 5 single_choice quiz questions on topic: "TypeScript Advanced". Difficulty: medium.',
        model: 'claude-3-5-haiku-20241022',
        idempotencyKey: dto.idempotencyKey,
      },
      { jobId: dto.idempotencyKey },
    );

    // 4. Verify return response
    expect(result).toEqual({
      jobId: createdId.toString(),
      status: AiGenerationJobStatus.PENDING,
    });
  });

  it('should rollback created doc and throw ForbiddenException when quota is exhausted', async () => {
    const createdId = new Types.ObjectId();
    mockJobInstance._id = createdId;
    mockJobInstance.save.mockResolvedValue(mockJobInstance);

    // Quota exhausted -> deductQuota returns null
    quotaService.deductQuota.mockResolvedValue(null);

    await expect(service.enqueueJob(orgId, userId, dto)).rejects.toThrow(
      new ForbiddenException('Monthly AI quota exceeded'),
    );

    // Verify rollback deletion was called
    expect(jobModel.deleteOne).toHaveBeenCalledWith({ _id: createdId });
    // Verify job was NOT pushed to queue
    expect(jobPublisher.publish).not.toHaveBeenCalled();
  });

  it('should rollback quota and mark job FAILED if pushing to BullMQ queue fails', async () => {
    quotaService.deductQuota.mockResolvedValue({
      _id: orgId,
      aiQuotaUsed: 1,
    } as never);
    jobModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    jobPublisher.publish.mockRejectedValue(new Error('Redis connection timeout'));

    await expect(service.enqueueJob(orgId, userId, dto)).rejects.toThrow(
      'Failed to queue AI generation job: Redis connection timeout',
    );

    // Verify quota was refunded via QuotaService
    expect(quotaService.refundQuota).toHaveBeenCalledWith(orgId, mockJobInstance._id.toString());
    // Verify job marked FAILED
    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: mockJobInstance._id },
      {
        $set: {
          status: AiGenerationJobStatus.FAILED,
          errorMessage: 'Failed to enqueue job to Redis queue',
        },
      },
    );
  });

  it('should safely handle concurrent duplicate requests via E11000 error without deducting quota', async () => {
    // Simulate race condition: save() throws E11000 duplicate key error
    const duplicateError = Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
    mockJobInstance.save.mockRejectedValue(duplicateError);

    const existingId = new Types.ObjectId();
    const existingJob = {
      _id: existingId,
      organizationId: orgId,
      status: AiGenerationJobStatus.PENDING,
      quizId: null,
    };
    jobModel.findOne.mockResolvedValue(existingJob);

    const result = await service.enqueueJob(orgId, userId, dto);

    // 1. Verify E11000 caught and queried existing doc
    expect(jobModel.findOne).toHaveBeenCalledWith({
      organizationId: orgId,
      idempotencyKey: dto.idempotencyKey,
    });

    // 2. Verify NO quota was deducted
    expect(quotaService.deductQuota).not.toHaveBeenCalled();

    // 3. Verify NO job pushed to queue
    expect(jobPublisher.publish).not.toHaveBeenCalled();

    // 4. Verify existing job returned
    expect(result).toEqual({
      jobId: existingId.toString(),
      status: AiGenerationJobStatus.PENDING,
      quizId: null,
    });
  });

  describe('getJobById', () => {
    it('should return job status when found in organization', async () => {
      const jobId = new Types.ObjectId().toString();
      const quizId = new Types.ObjectId();
      const now = new Date();

      jobModel.findOne.mockResolvedValue({
        _id: jobId,
        organizationId: orgId,
        status: AiGenerationJobStatus.COMPLETED,
        quizId,
        errorMessage: null,
        createdAt: now,
        completedAt: now,
      });

      const result = await service.getJobById(orgId, jobId);

      expect(jobModel.findOne).toHaveBeenCalledWith({
        _id: jobId,
        organizationId: orgId,
      });
      expect(result).toEqual({
        jobId,
        status: AiGenerationJobStatus.COMPLETED,
        quizId: quizId.toString(),
        errorMessage: null,
        createdAt: now,
        completedAt: now,
      });
    });

    it('should throw NotFoundException when job is not found', async () => {
      jobModel.findOne.mockResolvedValue(null);

      await expect(service.getJobById(orgId, 'non-existent-id')).rejects.toThrow(
        new NotFoundException('AI generation job not found'),
      );
    });
  });

  describe('getJobs', () => {
    it('should return paginated list of AI generation jobs for organization using paginate util', async () => {
      const mockResult = {
        items: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
      (paginate as jest.Mock).mockResolvedValue(mockResult);

      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const result = await service.getJobs(orgId, query);

      expect(paginate).toHaveBeenCalledWith(jobModel, { organizationId: orgId }, query, {
        allowedSortFields: ['createdAt', 'status', 'questionCount'],
      });
      expect(result).toEqual(mockResult);
    });
  });
});
