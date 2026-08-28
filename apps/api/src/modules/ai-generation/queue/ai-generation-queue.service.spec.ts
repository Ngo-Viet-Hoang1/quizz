import { Queue, Job } from 'bullmq';
import { QuestionType, QuizDifficulty } from '../../quiz/enums';
import { AI_GENERATION_JOB_NAME } from '../constants/ai-generation.constant';
import { AiGenerationJobPayload } from '../interfaces';
import { AiGenerationQueueService } from './ai-generation-queue.service';

describe('AiGenerationQueueService', () => {
  let service: AiGenerationQueueService;
  let mockQueue: jest.Mocked<Queue<AiGenerationJobPayload>>;

  const mockPayload: AiGenerationJobPayload = {
    jobId: 'job_mongo_123',
    organizationId: 'org_abc_1',
    userId: 'user_xyz_1',
    topic: 'World History',
    questionCount: 10,
    questionType: QuestionType.SINGLE_CHOICE,
    difficulty: QuizDifficulty.MEDIUM,
    prompt: 'Generate 10 history questions',
    model: 'claude-3-5-haiku-20241022',
    idempotencyKey: 'idemp-12345',
  };

  beforeEach(() => {
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Queue<AiGenerationJobPayload>>;

    service = new AiGenerationQueueService(mockQueue);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a job to the queue with attempts, backoff, and cleanup options', async () => {
    const dummyJob = {
      id: mockPayload.idempotencyKey,
      data: mockPayload,
    } as Job<AiGenerationJobPayload>;

    mockQueue.add.mockResolvedValue(dummyJob);

    const result = await service.addJob(mockPayload, mockPayload.idempotencyKey);

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(AI_GENERATION_JOB_NAME, mockPayload, {
      jobId: mockPayload.idempotencyKey,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100,
        age: 3600,
      },
      removeOnFail: {
        count: 50,
        age: 86400,
      },
    });
    expect(result).toBe(dummyJob);
    expect(result.id).toBe('idemp-12345');
    expect(result.data).toEqual(mockPayload);
  });

  it('should retrieve a job by jobId from the queue', async () => {
    const dummyJob = {
      id: 'idemp-12345',
      data: mockPayload,
    } as Job<AiGenerationJobPayload>;

    mockQueue.getJob.mockResolvedValue(dummyJob);

    const result = await service.getJob('idemp-12345');

    expect(mockQueue.getJob).toHaveBeenCalledWith('idemp-12345');
    expect(result).toBe(dummyJob);
  });
});
