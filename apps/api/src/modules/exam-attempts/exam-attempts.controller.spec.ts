import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { QueryExamAttemptDto } from './dto/query-exam-attempt.dto';
import { RecordViolationDto } from './dto/record-violation.dto';
import { ExamAttemptStatus } from './enums/exam-attempt-status.enum';
import { ViolationType } from './enums/violation-type.enum';
import { ExamAttemptsController } from './exam-attempts.controller';
import {
  ExamAttemptDetailResponse,
  IExamAttempt,
  StartExamAttemptResponse,
} from './interfaces/exam-attempt.interface';
import { ExamAttemptProgressService } from './services/exam-attempt-progress.service';
import { ExamAttemptQueryService } from './services/exam-attempt-query.service';
import { ExamAttemptStartService } from './services/exam-attempt-start.service';
import { ExamAttemptSubmitService } from './services/exam-attempt-submit.service';

describe('ExamAttemptsController', () => {
  let controller: ExamAttemptsController;
  let startService: jest.Mocked<ExamAttemptStartService>;
  let progressService: jest.Mocked<ExamAttemptProgressService>;
  let submitService: jest.Mocked<ExamAttemptSubmitService>;
  let queryService: jest.Mocked<ExamAttemptQueryService>;

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

    const mockSubmitService = {
      submitAttempt: jest.fn(),
    };

    const mockQueryService = {
      getMyHistory: jest.fn(),
      getAttemptDetail: jest.fn(),
      getAssignmentGradebook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamAttemptsController],
      providers: [
        { provide: ExamAttemptStartService, useValue: mockStartService },
        { provide: ExamAttemptProgressService, useValue: mockProgressService },
        { provide: ExamAttemptSubmitService, useValue: mockSubmitService },
        { provide: ExamAttemptQueryService, useValue: mockQueryService },
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
    submitService = module.get(ExamAttemptSubmitService);
    queryService = module.get(ExamAttemptQueryService);
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

  describe('submit', () => {
    it('should call submitService.submitAttempt and return wrapped ApiResponse', async () => {
      const mockAttemptId = new Types.ObjectId().toString();
      const mockAttempt = {
        _id: new Types.ObjectId(mockAttemptId),
        organizationId: mockOrgId,
        userId: mockUserId,
        status: ExamAttemptStatus.SUBMITTED,
        score: 10,
      } as unknown as IExamAttempt;

      submitService.submitAttempt.mockResolvedValue(mockAttempt);

      const response = await controller.submit(mockOrgId, mockUserId, mockAttemptId);

      expect(submitService.submitAttempt).toHaveBeenCalledWith(
        mockOrgId,
        mockUserId,
        mockAttemptId,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAttempt);
    });
  });

  describe('getMyHistory', () => {
    it('should call queryService.getMyHistory and return paginated ApiResponse', async () => {
      const mockAttempts = [
        {
          _id: new Types.ObjectId(),
          organizationId: mockOrgId,
          userId: mockUserId,
        } as unknown as IExamAttempt,
      ];
      const mockMeta = { page: 1, limit: 10, total: 1, totalPages: 1 };

      queryService.getMyHistory.mockResolvedValue({
        items: mockAttempts,
        meta: mockMeta,
      });

      const query: QueryExamAttemptDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const response = await controller.getMyHistory(mockOrgId, mockUserId, query);

      expect(queryService.getMyHistory).toHaveBeenCalledWith(mockOrgId, mockUserId, query);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAttempts);
      expect(response.meta).toEqual(mockMeta);
    });
  });

  describe('getAssignmentGradebook', () => {
    it('should call queryService.getAssignmentGradebook and return paginated ApiResponse', async () => {
      const mockAssignmentId = new Types.ObjectId().toString();
      const mockAttempts = [
        {
          _id: new Types.ObjectId(),
          organizationId: mockOrgId,
          assignmentId: new Types.ObjectId(mockAssignmentId),
          userId: mockUserId,
          score: 10,
        } as unknown as IExamAttempt,
      ];
      const mockMeta = { page: 1, limit: 10, total: 1, totalPages: 1 };

      queryService.getAssignmentGradebook.mockResolvedValue({
        items: mockAttempts,
        meta: mockMeta,
      });

      const query = { page: 1, limit: 10, sortBy: 'score', sortOrder: 'desc' as const };
      const response = await controller.getAssignmentGradebook(mockOrgId, mockAssignmentId, query);

      expect(queryService.getAssignmentGradebook).toHaveBeenCalledWith(
        mockOrgId,
        mockAssignmentId,
        query,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockAttempts);
      expect(response.meta).toEqual(mockMeta);
    });
  });

  describe('getAttemptDetail', () => {
    it('should call queryService.getAttemptDetail and return wrapped ApiResponse', async () => {
      const mockAttemptId = new Types.ObjectId().toString();
      const mockDetail: ExamAttemptDetailResponse = {
        attempt: {
          _id: new Types.ObjectId(mockAttemptId),
          organizationId: mockOrgId,
          userId: mockUserId,
        } as unknown as IExamAttempt,
        quizTitle: 'Midterm Exam',
        questions: [],
      };

      queryService.getAttemptDetail.mockResolvedValue(mockDetail);

      const response = await controller.getAttemptDetail(mockOrgId, mockUserId, mockAttemptId);

      expect(queryService.getAttemptDetail).toHaveBeenCalledWith(
        mockOrgId,
        mockUserId,
        mockAttemptId,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockDetail);
    });
  });
});
