import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExamAttemptSubmitService } from '../services/exam-attempt-submit.service';

@Injectable()
export class ExamAttemptsScheduler {
  private readonly logger = new Logger(ExamAttemptsScheduler.name);

  constructor(private readonly submitService: ExamAttemptSubmitService) {}

  @Cron('*/1 * * * *')
  async handleExpiredAttemptsScan(): Promise<void> {
    try {
      const count = await this.submitService.forceSubmitExpiredAttempts();
      if (count > 0) {
        this.logger.log(`Force-submitted ${count} expired exam attempt(s).`);
      }
    } catch (err) {
      this.logger.error('Failed to execute scheduled expired exam attempts scan:', err);
    }
  }
}
