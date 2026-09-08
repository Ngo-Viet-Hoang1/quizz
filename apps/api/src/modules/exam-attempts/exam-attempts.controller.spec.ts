import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { RecordViolationDto } from './dto/record-violation.dto';
import { ExamAttemptStatus } from './enums/exam-attempt-status.enum';
import { ViolationType } from './enums/violation-type.enum';
import { ExamAttemptsController } from './exam-attempts.controller';
import { IExamAttempt, StartExamAttemptResponse } from './interfaces/exam-attempt.interface';
import { ExamAttemptProgressService } from './services/exam-attempt-progress.service';
import { ExamAttemptStartService } from './services/exam-attempt-start.service';

describe('ExamAttemptsController', () => {
  let controller: ExamAttemptsController;
  let startService: jest.Mocked<ExamAttemptStartService>;
  let progressService: jest.Mocked<ExamAttemptProgressService>;

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';

  beforeEach(async () => {
    const mockStartService = {
      startAttempt: jest.fn(),
    };

    const mockProgressService = {
      saveAnswer: jest.fn(),
      recordViolation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamAttemptsController],
      providers: [
        { provide: ExamAttemptStartService, useValue: mockStartService },
        { provide: ExamAttemptProgressService, useValue: mockProgressService },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExamAttemptsController>(ExamAttemptsController);
    startService = module.get(ExamAttemptStartService);
    progressService = module.get(ExamAttemptProgressService);
  });

  describe('start', () => {
    it('should call startService.startAttempt and return wrapped ApiResponse', async () => {
      const mockResult: StartExamAttemptResponse = {
        attempt: {
          _id: new Types.ObjectId(),
          organizationId: mockOrgId,
          userId: mockUserId,
          quizId: new Types.ObjectId(),
          quizVersion: 1,
          status: ExamAttemptStatus.IN_PROGRESS,
          questionOrder: [],
          score: 0,
          totalPoints: 10,
          correctCount: 0,
          wrongCount: 0,
          answers: [],
          violations: [],
          startedAt: new Date(),
          expiresAt: new Date(),
          durationSec: 0,
        } as unknown as IExamAttempt,
        quizTitle: 'Test Quiz',
        questions: [],
      };

      startService.startAttempt.mockResolvedValue(mockResult);

      const dto = { quizId: new Types.ObjectId().toString() };
      const response = await controller.start(mockOrgId, mockUserId, dto);

      expect(startService.startAttempt).toHaveBeenCalledWith(mockOrgId, mockUserId, dto);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
    });
  });

  describe('saveAnswer', () => {
    it('should call progressService.saveAnswer and return wrapped ApiResponse', async () => {
      const mockAttemptId = new Types.ObjectId().toString();
      const mockAttempt = {
        _id: new Types.ObjectId(mockAttemptId),
        organizationId: mockOrgId,
        userId: mockUserId,
        status: ExamAttemptStatus.IN_PROGRESS,
      } as unknown as IExamAttempt;

      progressService.saveAnswer.mockResolvedValue(mockAttempt);

      const dto = { questionId: new Types.ObjectId().toString(), selectedOptionIds: [] };
      const response = await controller.saveAnswer(mockOrgId, mockUserId, mockAttemptId, dto);

      expect(progressService.saveAnswer).toHaveBeenCalledWith(
        mockOrgId,
        mockUserId,
        mockAttemptId,
        dto,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAttempt);
    });
  });

  describe('recordViolation', () => {
    it('should call progressService.recordViolation and return wrapped ApiResponse', async () => {
      const mockAttemptId = new Types.ObjectId().toString();
      const mockAttempt = {
        _id: new Types.ObjectId(mockAttemptId),
        organizationId: mockOrgId,
        userId: mockUserId,
        status: ExamAttemptStatus.IN_PROGRESS,
      } as unknown as IExamAttempt;

      progressService.recordViolation.mockResolvedValue(mockAttempt);

      const dto: RecordViolationDto = { type: ViolationType.TAB_SWITCH };
      const response = await controller.recordViolation(mockOrgId, mockUserId, mockAttemptId, dto);

      expect(progressService.recordViolation).toHaveBeenCalledWith(
        mockOrgId,
        mockUserId,
        mockAttemptId,
        dto,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAttempt);
    });
  });
});
