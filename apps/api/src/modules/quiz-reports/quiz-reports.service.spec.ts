import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExamAttempt } from '../exam-attempts/schemas/exam-attempt.schema';
import { NotificationService } from '../notifications/notification.service';
import { QuizVersion } from '../quiz/schemas/quiz-version.schema';
import { Quiz } from '../quiz/schemas/quiz.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QueryQuizReportDto } from './dto/query-quiz-report.dto';
import { ResolveQuizReportDto } from './dto/resolve-quiz-report.dto';
import { ReportReason, ReportStatus } from './enums';
import { QuizReportsService } from './quiz-reports.service';
import { QuizReport } from './schemas/quiz-report.schema';

describe('QuizReportsService', () => {
  let service: QuizReportsService;
  let mockReportModel: {
    (data: Record<string, unknown>): unknown;
    findOne: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let mockQuizModel: { findOne: jest.Mock };
  let mockQuizVersionModel: { findOne: jest.Mock };
  let mockAttemptModel: { findOne: jest.Mock };
  let mockNotificationService: { create: jest.Mock };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockQuizId = new Types.ObjectId();
  const mockQuestionId = new Types.ObjectId();
  const mockAttemptId = new Types.ObjectId();
  const mockReportId = new Types.ObjectId();

  const mockQuizDoc = {
    _id: mockQuizId,
    organizationId: mockOrgId,
    title: 'Science Quiz',
  };

  const createMockReportDoc = (
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> => ({
    _id: mockReportId,
    organizationId: mockOrgId,
    quizId: mockQuizId,
    quizTitle: 'Science Quiz',
    quizVersion: 1,
    questionId: mockQuestionId,
    attemptId: mockAttemptId,
    userId: mockUserId,
    userName: 'John Doe',
    userEmail: 'john@example.com',
    reason: ReportReason.INCORRECT_ANSWER,
    description: 'Wrong answer selected',
    status: ReportStatus.PENDING,
    save: jest.fn().mockImplementation(function (this: unknown): Promise<unknown> {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockImplementation(function (this: unknown): unknown {
      return this;
    }),
    ...overrides,
  });

  beforeEach(async () => {
    const createInstanceMock = jest.fn().mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      _id: new Types.ObjectId(),
      status: ReportStatus.PENDING,
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: new Types.ObjectId(),
        status: ReportStatus.PENDING,
      }),
    }));

    mockReportModel = Object.assign(createInstanceMock, {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    });

    mockQuizModel = {
      findOne: jest.fn(),
    };

    mockQuizVersionModel = {
      findOne: jest.fn(),
    };

    mockAttemptModel = {
      findOne: jest.fn(),
    };

    mockNotificationService = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizReportsService,
        { provide: getModelToken(QuizReport.name), useValue: mockReportModel },
        { provide: getModelToken(Quiz.name), useValue: mockQuizModel },
        { provide: getModelToken(QuizVersion.name), useValue: mockQuizVersionModel },
        { provide: getModelToken(ExamAttempt.name), useValue: mockAttemptModel },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<QuizReportsService>(QuizReportsService);
  });

  describe('createReport', () => {
    it('should successfully create a quiz report when quiz exists', async () => {
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockQuizDoc),
        }),
      });

      const dto: CreateQuizReportDto = {
        quizId: mockQuizId.toString(),
        quizVersion: 1,
        questionId: mockQuestionId.toString(),
        attemptId: mockAttemptId.toString(),
        reason: ReportReason.INCORRECT_ANSWER,
        description: 'Question 1 has wrong key',
      };

      const result = await service.createReport(
        mockOrgId,
        mockUserId,
        'John Doe',
        'john@example.com',
        dto,
      );

      expect(mockQuizModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.quizTitle).toBe('Science Quiz');
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const dto: CreateQuizReportDto = {
        quizId: mockQuizId.toString(),
        quizVersion: 1,
        questionId: mockQuestionId.toString(),
        reason: ReportReason.TYPO,
        description: 'Typo in question',
      };

      await expect(
        service.createReport(mockOrgId, mockUserId, 'John', 'john@test.com', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllReports', () => {
    it('should paginate reports with filter and search', async () => {
      const mockItems = [createMockReportDoc()];
      mockReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
              }),
            }),
          }),
        }),
      });
      mockReportModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const query = Object.assign(new QueryQuizReportDto(), {
        status: ReportStatus.PENDING,
        search: 'Science',
        page: 1,
        limit: 10,
      });

      const result = await service.findAllReports(mockOrgId, query);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getReportById', () => {
    it('should return report and question from snapshot', async () => {
      const reportDoc = createMockReportDoc();
      mockReportModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(reportDoc),
        }),
      });

      const snapshotDoc = {
        version: 1,
        snapshot: {
          questions: [
            {
              _id: mockQuestionId,
              content: 'What is photosynthesis?',
              options: [{ content: 'Option A', isCorrect: true }],
            },
          ],
        },
      };

      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(snapshotDoc),
        }),
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(snapshotDoc),
          }),
        }),
      });

      const result = await service.getReportById(mockOrgId, mockReportId.toString());

      expect(result.report).toBeDefined();
      expect(result.question).toBeDefined();
      expect(result.question?.content).toBe('What is photosynthesis?');
    });
  });

  describe('resolveReport', () => {
    it('should resolve report and void question from student attempt total score', async () => {
      const reportDoc = createMockReportDoc();
      mockReportModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reportDoc),
      });

      const mockAttemptDoc = {
        _id: mockAttemptId,
        questionOrder: [mockQuestionId],
        answers: [{ questionId: mockQuestionId, isCorrect: false }],
        score: 0,
        totalPoints: 10,
        correctCount: 0,
        wrongCount: 1,
        save: jest.fn().mockResolvedValue(true),
      };

      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAttemptDoc),
      });

      const dto: ResolveQuizReportDto = {
        status: ReportStatus.RESOLVED,
        resolutionNotes: 'Accepted student report. Question 1 voided from total score.',
      };

      const result = await service.resolveReport(
        mockOrgId,
        'teacher_999',
        mockReportId.toString(),
        dto,
      );

      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(mockAttemptDoc.answers[0].isCorrect).toBeNull();
      expect(mockAttemptDoc.totalPoints).toBe(0);
      expect(mockAttemptDoc.wrongCount).toBe(0);
      expect(mockAttemptDoc.save).toHaveBeenCalled();
      expect(mockNotificationService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if report is already resolved', async () => {
      const resolvedReport = createMockReportDoc({ status: ReportStatus.RESOLVED });
      mockReportModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(resolvedReport),
      });

      const dto: ResolveQuizReportDto = {
        status: ReportStatus.RESOLVED,
      };

      await expect(
        service.resolveReport(mockOrgId, 'teacher_999', mockReportId.toString(), dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
