import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  AI_GENERATION_JOB_NAME,
  AI_GENERATION_QUEUE_NAME,
} from '../constants/ai-generation.constant';
import { AiGenerationJobPayload } from '../interfaces';

@Injectable()
export class AiGenerationQueueService {
  constructor(
    @InjectQueue(AI_GENERATION_QUEUE_NAME)
    private readonly queue: Queue<AiGenerationJobPayload>,
  ) {}

  async addJob(
    payload: AiGenerationJobPayload,
    idempotencyKey: string,
  ): Promise<Job<AiGenerationJobPayload>> {
    return this.queue.add(AI_GENERATION_JOB_NAME, payload, {
      jobId: idempotencyKey,
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
  }

  async getJob(jobId: string): Promise<Job<AiGenerationJobPayload> | undefined> {
    return this.queue.getJob(jobId);
  }
}
