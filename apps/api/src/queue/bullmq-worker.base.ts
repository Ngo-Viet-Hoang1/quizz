import { WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';

export abstract class BullMqWorkerBase extends WorkerHost {
  protected abstract readonly logger: Logger;
  protected readonly timeoutMs: number = 120_000;

  protected abstract handleJob(job: Job, signal: AbortSignal): Promise<void>;

  protected isRetryable(_error: unknown): boolean {
    return true;
  }

  async process(job: Job): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 3;

    this.logger.log(`[${job.name}] job=${job.id} attempt=${attempt}/${maxAttempts} START`);

    try {
      await this.handleJob(job, controller.signal);
      this.logger.log(`[${job.name}] job=${job.id} COMPLETED`);
    } catch (error) {
      const isTimeout = controller.signal.aborted;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${job.name}] job=${job.id} FAILED: ${msg}${isTimeout ? ' (TIMEOUT)' : ''}`,
      );

      if (!this.isRetryable(error) || isTimeout) {
        throw new UnrecoverableError(msg);
      }

      throw error; // BullMQ auto retry follow exponential backoff
    } finally {
      clearTimeout(timer);
    }
  }

  /** Graceful shutdown — waiting for running jobs to complete before shutting down*/
  async onModuleDestroy(): Promise<void> {
    if (!this.worker) return;

    try {
      this.logger.log('Closing BullMQ worker gracefully...');
      await this.worker.close();
      this.logger.log('BullMQ worker closed successfully.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // Error: "Connection is closed" while shutting down is normal because Redis has been shut down first
      if (msg.includes('Connection is closed')) {
        this.logger.debug('BullMQ worker closed (Redis connection already terminated).');
      } else {
        this.logger.warn(`Unexpected error while closing BullMQ worker: ${msg}`);
      }
    }
  }
}
