import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, UnrecoverableError } from 'bullmq';
import { Types } from 'mongoose';
import { QuestionType, QuizDifficulty, QuizSourceType, QuizStatus } from '../../quiz/enums';
import { Quiz } from '../../quiz/schemas/quiz.schema';
import { AiGenerationJobStatus } from '../enums';
import { AiGenerationJobPayload } from '../interfaces';
import { AiGeneratedQuestion } from '../provider/ai-provider.interface';
import { ClaudeAiProviderService } from '../provider/claude-ai-provider.service';
import { AiGenerationJob } from '../schemas';
import { AiGenerationQuotaService } from '../services/ai-generation-quota.service';
import { AiGenerationProcessor } from './ai-generation.processor';

type MockQuizInstance = {
  _id: Types.ObjectId;
  save: jest.Mock;
};

type MockQuizModel = jest.Mock & {
  create: jest.Mock;
};

type MockJobModel = {
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
};

describe('AiGenerationProcessor', () => {
  let processor: AiGenerationProcessor;
  let jobModel: MockJobModel;
  let quizModel: MockQuizModel;
  let mockQuizInstance: MockQuizInstance;
  let aiProvider: jest.Mocked<ClaudeAiProviderService>;
  let quotaService: jest.Mocked<AiGenerationQuotaService>;

  const payload: AiGenerationJobPayload = {
    jobId: new Types.ObjectId().toString(),
    organizationId: 'org_abc_1',
    userId: 'user_xyz_1',
    topic: 'TypeScript Generics',
    questionCount: 2,
    questionType: QuestionType.SINGLE_CHOICE,
    difficulty: QuizDifficulty.MEDIUM,
    prompt: 'Generate 2 questions',
    model: 'claude-3-5-haiku-20241022',
    idempotencyKey: 'idemp-12345',
  };

  const mockJob = {
    data: payload,
    name: 'generate-quiz',
    id: payload.jobId,
    attemptsMade: 0,
    opts: { attempts: 3 },
  } as unknown as Job<AiGenerationJobPayload>;

  beforeEach(async () => {
    jobModel = {
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockQuizInstance = {
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue(null),
    };
    mockQuizInstance.save.mockResolvedValue(mockQuizInstance);

    const mockConstructor = jest.fn().mockImplementation(() => mockQuizInstance);
    quizModel = Object.assign(mockConstructor, {
      create: jest.fn(),
    });

    aiProvider = {
      generateQuiz: jest.fn(),
    } as unknown as jest.Mocked<ClaudeAiProviderService>;

    quotaService = {
      refundQuota: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AiGenerationQuotaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerationProcessor,
        {
          provide: getModelToken(AiGenerationJob.name),
          useValue: jobModel,
        },
        {
          provide: getModelToken(Quiz.name),
          useValue: quizModel,
        },
        {
          provide: ClaudeAiProviderService,
          useValue: aiProvider,
        },
        {
          provide: AiGenerationQuotaService,
          useValue: quotaService,
        },
      ],
    }).compile();

    processor = module.get<AiGenerationProcessor>(AiGenerationProcessor);
  });

  it('should transition to PROCESSING, generate questions, create Quiz Draft, and mark job COMPLETED', async () => {
    // 1. findOneAndUpdate returns job (transition PENDING -> PROCESSING)
    jobModel.findOneAndUpdate.mockResolvedValue({
      _id: payload.jobId,
      status: AiGenerationJobStatus.PROCESSING,
    });

    // 2. AI returns valid questions
    aiProvider.generateQuiz.mockResolvedValue({
      questions: [
        {
          content: 'What is a Generic?',
          type: QuestionType.SINGLE_CHOICE,
          points: 1,
          explanation: 'Generics allow type parameters.',
          options: [
            { content: 'Type parameter', isCorrect: true },
            { content: 'Variable', isCorrect: false },
          ],
        },
        {
          content: 'What is an Interface?',
          type: QuestionType.SINGLE_CHOICE,
          points: 1,
          explanation: 'Interfaces define contracts.',
          options: [
            { content: 'Contract', isCorrect: true },
            { content: 'Class', isCorrect: false },
          ],
        },
      ],
      rawResponse: { id: 'msg_123' },
      inputTokens: 100,
      outputTokens: 200,
      costUsd: 0.00088,
    });

    await processor.process(mockJob);

    // Verify atomic transition to PROCESSING
    expect(jobModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: payload.jobId,
        organizationId: payload.organizationId,
        status: AiGenerationJobStatus.PENDING,
      },
      {
        $set: { status: AiGenerationJobStatus.PROCESSING },
      },
      { new: true },
    );

    // Verify AI call — parameter object with signal passed from BullMqWorkerBase
    expect(aiProvider.generateQuiz).toHaveBeenCalledWith({
      topic: payload.topic,
      questionCount: payload.questionCount,
      questionType: payload.questionType,
      difficulty: payload.difficulty,
      model: payload.model,
      signal: expect.any(AbortSignal),
      avoidTopicsOrQuestions: undefined,
    });

    // Verify Quiz Draft creation
    expect(quizModel).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: payload.organizationId,
        ownerId: payload.userId,
        title: payload.topic,
        sourceType: QuizSourceType.AI_GENERATED,
        status: QuizStatus.DRAFT,
      }),
    );
    expect(mockQuizInstance.save).toHaveBeenCalledTimes(1);

    // Verify Job marked COMPLETED with quizId and stats
    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: payload.jobId },
      expect.objectContaining({
        $set: expect.objectContaining({
          quizId: mockQuizInstance._id,
          status: AiGenerationJobStatus.COMPLETED,
          completedCount: 2,
          inputTokens: 100,
          outputTokens: 200,
          costUsd: 0.00088,
        }),
      }),
    );

    // Verify NO quota refund was called
    expect(quotaService.refundQuota).not.toHaveBeenCalled();
  });

  it('should mark job FAILED, refund quota, and re-throw error when AI call fails', async () => {
    jobModel.findOneAndUpdate.mockResolvedValue({
      _id: payload.jobId,
      status: AiGenerationJobStatus.PROCESSING,
    });

    aiProvider.generateQuiz.mockRejectedValue(new Error('Claude API rate limit exceeded'));

    await expect(processor.process(mockJob)).rejects.toThrow('Claude API rate limit exceeded');

    // Verify marked FAILED with error message
    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: payload.jobId },
      {
        $set: {
          status: AiGenerationJobStatus.FAILED,
          errorMessage: 'Claude API rate limit exceeded',
        },
      },
    );

    // Verify quota refund was called
    expect(quotaService.refundQuota).toHaveBeenCalledWith(payload.organizationId, payload.jobId);
  });

  it('should early-return if job status is no longer PENDING (e.g. BullMQ retry after failed)', async () => {
    // findOneAndUpdate returns null because status is no longer PENDING
    jobModel.findOneAndUpdate.mockResolvedValue(null);

    await processor.process(mockJob);

    // Verify AI provider is NOT called
    expect(aiProvider.generateQuiz).not.toHaveBeenCalled();
    // Verify Quiz model is NOT instantiated
    expect(quizModel).not.toHaveBeenCalled();
    // Verify quota refund is NOT called again
    expect(quotaService.refundQuota).not.toHaveBeenCalled();
  });

  it('should mark job FAILED, throw UnrecoverableError and NOT refund quota when AI provider flags safety violation', async () => {
    jobModel.findOneAndUpdate.mockResolvedValue({
      _id: payload.jobId,
      status: AiGenerationJobStatus.PROCESSING,
    });

    const safetyViolationError = new Error(
      'Content safety violation: Topic contains violent or offensive content.',
    );
    aiProvider.generateQuiz.mockRejectedValue(safetyViolationError);

    await expect(processor.process(mockJob)).rejects.toThrow(UnrecoverableError);

    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: payload.jobId },
      {
        $set: {
          status: AiGenerationJobStatus.FAILED,
          errorMessage: 'Content safety violation: Topic contains violent or offensive content.',
        },
      },
    );

    // Verify quota is RETAINED (NOT refunded) on intentional safety violation
    expect(quotaService.refundQuota).not.toHaveBeenCalled();
  });

  it('should split larger question requests into sub-batches of 5 and update job progress iteratively', async () => {
    const multiPayload: AiGenerationJobPayload = {
      ...payload,
      questionCount: 12, // 12 questions = 5 + 5 + 2
    };
    const multiJob = {
      ...mockJob,
      data: multiPayload,
    } as unknown as Job<AiGenerationJobPayload>;

    jobModel.findOneAndUpdate.mockResolvedValue({
      _id: multiPayload.jobId,
      status: AiGenerationJobStatus.PROCESSING,
    });

    const createMockQ = (title: string): AiGeneratedQuestion => ({
      content: title,
      type: QuestionType.SINGLE_CHOICE,
      points: 1,
      options: [
        { content: 'A', isCorrect: true },
        { content: 'B', isCorrect: false },
      ],
    });

    // Batch 1 (5 questions)
    aiProvider.generateQuiz.mockResolvedValueOnce({
      questions: [
        createMockQ('Q1'),
        createMockQ('Q2'),
        createMockQ('Q3'),
        createMockQ('Q4'),
        createMockQ('Q5'),
      ],
      rawResponse: {},
      inputTokens: 50,
      outputTokens: 100,
      costUsd: 0.0004,
    });

    // Batch 2 (5 questions)
    aiProvider.generateQuiz.mockResolvedValueOnce({
      questions: [
        createMockQ('Q6'),
        createMockQ('Q7'),
        createMockQ('Q8'),
        createMockQ('Q9'),
        createMockQ('Q10'),
      ],
      rawResponse: {},
      inputTokens: 50,
      outputTokens: 100,
      costUsd: 0.0004,
    });

    // Batch 3 (2 questions)
    aiProvider.generateQuiz.mockResolvedValueOnce({
      questions: [createMockQ('Q11'), createMockQ('Q12')],
      rawResponse: {},
      inputTokens: 20,
      outputTokens: 40,
      costUsd: 0.0002,
    });

    await processor.process(multiJob);

    // AI should be called 3 times (5, 5, 2)
    expect(aiProvider.generateQuiz).toHaveBeenCalledTimes(3);

    // Final quiz should have 12 questions
    expect(quizModel).toHaveBeenCalledWith(
      expect.objectContaining({
        questionCount: 12,
        questions: expect.arrayContaining([
          expect.objectContaining({ content: 'Q1' }),
          expect.objectContaining({ content: 'Q12' }),
        ]),
      }),
    );

    // Final job update with completedCount: 12 and accumulated metrics
    expect(jobModel.updateOne).toHaveBeenCalledWith(
      { _id: multiPayload.jobId },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: AiGenerationJobStatus.COMPLETED,
          completedCount: 12,
          inputTokens: 120,
          outputTokens: 240,
          costUsd: 0.001,
        }),
      }),
    );
  });
});
