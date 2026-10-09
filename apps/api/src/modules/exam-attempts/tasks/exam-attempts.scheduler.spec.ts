import { Test, TestingModule } from '@nestjs/testing';
import { ExamAttemptSubmitService } from '../services/exam-attempt-submit.service';
import { ExamAttemptsScheduler } from './exam-attempts.scheduler';

describe('ExamAttemptsScheduler', () => {
  let scheduler: ExamAttemptsScheduler;
  let submitService: jest.Mocked<ExamAttemptSubmitService>;

  beforeEach(async () => {
    const mockSubmitService = {
      forceSubmitExpiredAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamAttemptsScheduler,
        { provide: ExamAttemptSubmitService, useValue: mockSubmitService },
      ],
    }).compile();

    scheduler = module.get<ExamAttemptsScheduler>(ExamAttemptsScheduler);
    submitService = module.get(ExamAttemptSubmitService);
  });

  describe('handleExpiredAttemptsScan', () => {
    it('should invoke submitService.forceSubmitExpiredAttempts', async () => {
      submitService.forceSubmitExpiredAttempts.mockResolvedValue(3);

      await scheduler.handleExpiredAttemptsScan();

      expect(submitService.forceSubmitExpiredAttempts).toHaveBeenCalled();
    });

    it('should handle and catch errors gracefully without throwing', async () => {
      submitService.forceSubmitExpiredAttempts.mockRejectedValue(new Error('Database timeout'));

      await expect(scheduler.handleExpiredAttemptsScan()).resolves.not.toThrow();
    });
  });
});
