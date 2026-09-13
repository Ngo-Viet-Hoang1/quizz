import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QueryQuizReportDto } from './dto/query-quiz-report.dto';
import { ResolveQuizReportDto } from './dto/resolve-quiz-report.dto';
import { ReportReason, ReportStatus } from './enums';
import { QuizReportsController } from './quiz-reports.controller';
import { QuizReportsService } from './quiz-reports.service';

describe('QuizReportsController', () => {
  let controller: QuizReportsController;
  let mockService: {
    createReport: jest.Mock;
    findAllReports: jest.Mock;
    getReportById: jest.Mock;
    resolveReport: jest.Mock;
  };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockUser = {
    _id: mockUserId,
    fullName: 'John Doe',
    email: 'john@example.com',
  } as unknown as UserDocument;

  beforeEach(async () => {
    mockService = {
      createReport: jest.fn(),
      findAllReports: jest.fn(),
      getReportById: jest.fn(),
      resolveReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizReportsController],
      providers: [{ provide: QuizReportsService, useValue: mockService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuizReportsController>(QuizReportsController);
  });

  it('should call service.createReport on createReport', async () => {
    const dto: CreateQuizReportDto = {
      quizId: new Types.ObjectId().toString(),
      quizVersion: 1,
      questionId: new Types.ObjectId().toString(),
      reason: ReportReason.INCORRECT_ANSWER,
      description: 'Report description',
    };

    mockService.createReport.mockResolvedValue({ _id: new Types.ObjectId() });

    const result = await controller.createReport(mockOrgId, mockUser, dto);

    expect(mockService.createReport).toHaveBeenCalledWith(
      mockOrgId,
      mockUserId,
      'John Doe',
      'john@example.com',
      dto,
    );
    expect(result).toBeDefined();
  });

  it('should call service.findAllReports on findAll', async () => {
    const query = new QueryQuizReportDto();
    mockService.findAllReports.mockResolvedValue({ items: [], meta: {} });

    const result = await controller.findAll(mockOrgId, query);

    expect(mockService.findAllReports).toHaveBeenCalledWith(mockOrgId, query);
    expect(result.items).toEqual([]);
  });

  it('should call service.resolveReport on resolveReport', async () => {
    const id = new Types.ObjectId().toString();
    const dto: ResolveQuizReportDto = {
      status: ReportStatus.RESOLVED,
      resolutionNotes: 'Accepted report',
    };

    mockService.resolveReport.mockResolvedValue({ status: ReportStatus.RESOLVED });

    const result = await controller.resolveReport(mockOrgId, mockUserId, id, dto);

    expect(mockService.resolveReport).toHaveBeenCalledWith(mockOrgId, mockUserId, id, dto);
    expect(result.status).toBe(ReportStatus.RESOLVED);
  });
});
