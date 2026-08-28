import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { Types } from 'mongoose';
import { Organization } from '../organizations/schemas/organization.schema';
import { QuestionType, QuizDifficulty } from '../quiz/enums';
import { AiGenerationService } from './ai-generation.service';
import { EnqueueAiGenerationJobDto } from './dto';
import { AiGenerationJobStatus, SupportedAiModel } from './enums';
import { AiGenerationJobPayload } from './interfaces';
import { AiGenerationQueueService } from './queue/ai-generation-queue.service';
import { AiGenerationJob } from './schemas';

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

type MockOrgModel = {
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
};

describe('AiGenerationService - enqueueJob', () => {
  let service: AiGenerationService;
  let jobModel: MockJobModel;
  let orgModel: MockOrgModel;
  let queueService: jest.Mocked<AiGenerationQueueService>;
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


    orgModel = {
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };

    queueService = {
      addJob: jest.fn(),
      getJob: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<AiGenerationQueueService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerationService,
        {
          provide: getModelToken(AiGenerationJob.name),
          useValue: jobModel,
        },
        {
          provide: getModelToken(Organization.name),
          useValue: orgModel,
        },
        {
          provide: AiGenerationQueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<AiGenerationService>(AiGenerationService);
  });

  it('should successfully create doc, deduct quota atomic, push to BullMQ and return pending status', async () => {
    const createdId = new Types.ObjectId();
    mockJobInstance._id = createdId;
    mockJobInstance.save.mockResolvedValue(mockJobInstance);

    orgModel.findOneAndUpdate.mockResolvedValue({
      _id: orgId,
      aiQuotaMonthly: 100,
      aiQuotaUsed: 1,
    });

    queueService.addJob.mockResolvedValue({
      id: dto.idempotencyKey,
    } as unknown as Job<AiGenerationJobPayload>);

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

    // 2. Verify atomic quota deduction happened AFTER insert
    expect(orgModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: orgId,
        $expr: {
          $lte: [{ $add: ['$aiQuotaUsed', 1] }, '$aiQuotaMonthly'],
        },
      },
      { $inc: { aiQuotaUsed: 1 } },
      { new: true },
    );

    // 3. Verify pushed to BullMQ
    expect(queueService.addJob).toHaveBeenCalledWith(
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
      dto.idempotencyKey,
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

    // Quota exhausted -> findOneAndUpdate returns null
    orgModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(service.enqueueJob(orgId, userId, dto)).rejects.toThrow(
      new ForbiddenException('Monthly AI quota exceeded'),
    );

    // Verify rollback deletion was called
    expect(jobModel.deleteOne).toHaveBeenCalledWith({ _id: createdId });
    // Verify job was NOT pushed to queue
    expect(queueService.addJob).not.toHaveBeenCalled();
  });

  it('should rollback quota and mark job FAILED if pushing to BullMQ queue fails', async () => {
    orgModel.findOneAndUpdate.mockResolvedValue({
      _id: orgId,
      aiQuotaUsed: 1,
    });
    orgModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    jobModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    queueService.addJob.mockRejectedValue(new Error('Redis connection timeout'));

    await expect(service.enqueueJob(orgId, userId, dto)).rejects.toThrow(
      'Failed to queue AI generation job: Redis connection timeout',
    );

    // Verify quota rollback was called
    expect(orgModel.updateOne).toHaveBeenCalledWith({ _id: orgId }, { $inc: { aiQuotaUsed: -1 } });
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
    expect(orgModel.findOneAndUpdate).not.toHaveBeenCalled();

    // 3. Verify NO job pushed to queue
    expect(queueService.addJob).not.toHaveBeenCalled();

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
});


