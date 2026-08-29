import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { QUEUE_NAMES, TOPIC_TO_QUEUE } from './queue.constants';

@Injectable()
export class BullMqJobPublisher {
  private readonly logger = new Logger(BullMqJobPublisher.name);
  private readonly queueMap: Record<string, Queue>;

  constructor(
    @InjectQueue(QUEUE_NAMES.AI_GENERATION) aiQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EXAM_EXPIRE) examQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) notiQueue: Queue,
  ) {
    this.queueMap = {
      [QUEUE_NAMES.AI_GENERATION]: aiQueue,
      [QUEUE_NAMES.EXAM_EXPIRE]: examQueue,
      [QUEUE_NAMES.NOTIFICATION]: notiQueue,
    };
  }

  async publish<T>(jobName: string, data: T, opts?: JobsOptions): Promise<void> {
    const queueName = TOPIC_TO_QUEUE[jobName];
    if (!queueName) {
      throw new Error(`Unknown job name: ${jobName}. Check TOPIC_TO_QUEUE in queue.constants.ts`);
    }

    // dedup: BullMQ skip if jobId duplicate with wating/active job
    await this.queueMap[queueName].add(jobName, data, opts);

    this.logger.debug(`Published job [${jobName}] → queue [${queueName}]`);
  }
}
