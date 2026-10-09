import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RecordViolationDto } from '../dto/record-violation.dto';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { ViolationType } from '../enums/violation-type.enum';
import { ExamAttemptAnswer } from '../schemas/exam-attempt-answer.schema';
import { ExamAttemptViolation } from '../schemas/exam-attempt-violation.schema';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';
import { ExamAttemptProgressService } from './exam-attempt-progress.service';

describe('ExamAttemptProgressService', () => {
  let service: ExamAttemptProgressService;
  let mockAttemptModel: { findOne: jest.Mock };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockAttemptId = new Types.ObjectId();
  const mockQuestionId1 = new Types.ObjectId();
  const mockQuestionId2 = new Types.ObjectId();
  const mockOptionId = new Types.ObjectId();

  const createMockAttempt = (
    overrides: Record<string, unknown> = {},
  ): {
    _id: Types.ObjectId;
    organizationId: string;
    userId: string;
    status: ExamAttemptStatus;
    expiresAt: Date;
    questionOrder: Types.ObjectId[];
    answers: ExamAttemptAnswer[];
    violations: ExamAttemptViolation[];
    save: jest.Mock;
  } => {
    const defaultAnswers: ExamAttemptAnswer[] = [];
    const defaultViolations: ExamAttemptViolation[] = [];
    return {
      _id: mockAttemptId,
      organizationId: mockOrgId,
      userId: mockUserId,
      status: ExamAttemptStatus.IN_PROGRESS,
      expiresAt: new Date(Date.now() + 1000 * 3600),
      questionOrder: [mockQuestionId1, mockQuestionId2],
      answers: defaultAnswers,
      violations: defaultViolations,
      save: jest.fn().mockImplementation(function (this: unknown): Promise<unknown> {
        return Promise.resolve(this);
      }),
      ...overrides,
    };
  };

  beforeEach(async () => {
    mockAttemptModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamAttemptProgressService,
        { provide: getModelToken(ExamAttempt.name), useValue: mockAttemptModel },
      ],
    }).compile();

    service = module.get<ExamAttemptProgressService>(ExamAttemptProgressService);
  });

  describe('saveAnswer', () => {
    it('should successfully add a new answer to an active attempt', async () => {
      const attemptDoc = createMockAttempt();
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: SubmitAnswerDto = {
        questionId: mockQuestionId1.toString(),
        selectedOptionIds: [mockOptionId.toString()],
        timeSpentSec: 20,
      };

      const result = await service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto);

      expect(attemptDoc.answers).toHaveLength(1);
      expect(attemptDoc.answers[0].questionId.toString()).toBe(mockQuestionId1.toString());
      expect(attemptDoc.answers[0].selectedOptionIds?.[0].toString()).toBe(mockOptionId.toString());
      expect(attemptDoc.answers[0].timeSpentSec).toBe(20);
      expect(attemptDoc.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should successfully update an existing answer in an active attempt', async () => {
      const existingAnswer: ExamAttemptAnswer = {
        questionId: mockQuestionId1,
        selectedOptionIds: [new Types.ObjectId()],
        textAnswer: null,
        orderAnswer: [],
        isCorrect: null,
        timeSpentSec: 10,
        answeredAt: new Date(),
      };

      const attemptDoc = createMockAttempt({ answers: [existingAnswer] });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: SubmitAnswerDto = {
        questionId: mockQuestionId1.toString(),
        selectedOptionIds: [mockOptionId.toString()],
        timeSpentSec: 35,
      };

      await service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto);

      expect(attemptDoc.answers).toHaveLength(1);
      expect(attemptDoc.answers[0].selectedOptionIds?.[0].toString()).toBe(mockOptionId.toString());
      expect(attemptDoc.answers[0].timeSpentSec).toBe(35);
    });

    it('should throw NotFoundException if attempt is not found', async () => {
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: SubmitAnswerDto = {
        questionId: mockQuestionId1.toString(),
      };

      await expect(
        service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if attempt is not in_progress', async () => {
      const attemptDoc = createMockAttempt({ status: ExamAttemptStatus.SUBMITTED });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: SubmitAnswerDto = {
        questionId: mockQuestionId1.toString(),
      };

      await expect(
        service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if attempt time has expired', async () => {
      const attemptDoc = createMockAttempt({
        expiresAt: new Date(Date.now() - 1000 * 60),
      });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: SubmitAnswerDto = {
        questionId: mockQuestionId1.toString(),
      };

      await expect(
        service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if question does not belong to attempt', async () => {
      const attemptDoc = createMockAttempt();
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const foreignQuestionId = new Types.ObjectId();
      const dto: SubmitAnswerDto = {
        questionId: foreignQuestionId.toString(),
      };

      await expect(
        service.saveAnswer(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordViolation', () => {
    it('should successfully record a violation to an active attempt', async () => {
      const attemptDoc = createMockAttempt();
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: RecordViolationDto = {
        type: ViolationType.TAB_SWITCH,
      };

      const result = await service.recordViolation(
        mockOrgId,
        mockUserId,
        mockAttemptId.toString(),
        dto,
      );

      expect(attemptDoc.violations).toHaveLength(1);
      expect(attemptDoc.violations[0].type).toBe(ViolationType.TAB_SWITCH);
      expect(attemptDoc.violations[0].occurredAt).toBeDefined();
      expect(attemptDoc.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if attempt is not found when recording violation', async () => {
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: RecordViolationDto = {
        type: ViolationType.FULLSCREEN_EXIT,
      };

      await expect(
        service.recordViolation(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if attempt is already completed when recording violation', async () => {
      const attemptDoc = createMockAttempt({ status: ExamAttemptStatus.SUBMITTED });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      const dto: RecordViolationDto = {
        type: ViolationType.DEVTOOLS_OPEN,
      };

      await expect(
        service.recordViolation(mockOrgId, mockUserId, mockAttemptId.toString(), dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
