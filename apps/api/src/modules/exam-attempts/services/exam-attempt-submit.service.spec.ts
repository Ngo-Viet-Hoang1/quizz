import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QuizVersion } from '../../quiz/schemas/quiz-version.schema';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { GradingResult, IExamAttemptAnswer } from '../interfaces/exam-attempt.interface';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';
import { AutoGradingService } from './auto-grading.service';
import { ExamAttemptSubmitService } from './exam-attempt-submit.service';

describe('ExamAttemptSubmitService', () => {
  let service: ExamAttemptSubmitService;
  let mockAttemptModel: { findOne: jest.Mock; find: jest.Mock };
  let mockQuizVersionModel: { findOne: jest.Mock };
  let mockAutoGradingService: { gradeAttempt: jest.Mock };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockAttemptId = new Types.ObjectId();
  const mockQuizId = new Types.ObjectId();
  const mockQuestionId = new Types.ObjectId();

  const createMockAttempt = (
    overrides: Record<string, unknown> = {},
  ): {
    _id: Types.ObjectId;
    organizationId: string;
    userId: string;
    quizId: Types.ObjectId;
    quizVersion: number;
    status: ExamAttemptStatus;
    startedAt: Date;
    questionOrder: Types.ObjectId[];
    answers: IExamAttemptAnswer[];
    score: number;
    totalPoints: number;
    correctCount: number;
    wrongCount: number;
    submittedAt?: Date;
    durationSec?: number;
    save: jest.Mock;
  } => {
    return {
      _id: mockAttemptId,
      organizationId: mockOrgId,
      userId: mockUserId,
      quizId: mockQuizId,
      quizVersion: 1,
      status: ExamAttemptStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      questionOrder: [mockQuestionId],
      answers: [],
      score: 0,
      totalPoints: 0,
      correctCount: 0,
      wrongCount: 0,
      save: jest.fn().mockImplementation(function (this: unknown): Promise<unknown> {
        return Promise.resolve(this);
      }),
      ...overrides,
    };
  };

  const createMockQuizSnapshot = (): {
    _id: Types.ObjectId;
    quizId: Types.ObjectId;
    organizationId: string;
    version: number;
    snapshot: {
      title: string;
      questions: { _id: Types.ObjectId; points: number }[];
    };
  } => ({
    _id: new Types.ObjectId(),
    quizId: mockQuizId,
    organizationId: mockOrgId,
    version: 1,
    snapshot: {
      title: 'Biology Quiz',
      questions: [{ _id: mockQuestionId, points: 10 }],
    },
  });

  beforeEach(async () => {
    mockAttemptModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockQuizVersionModel = {
      findOne: jest.fn(),
    };
    mockAutoGradingService = {
      gradeAttempt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamAttemptSubmitService,
        { provide: getModelToken(ExamAttempt.name), useValue: mockAttemptModel },
        { provide: getModelToken(QuizVersion.name), useValue: mockQuizVersionModel },
        { provide: AutoGradingService, useValue: mockAutoGradingService },
      ],
    }).compile();

    service = module.get<ExamAttemptSubmitService>(ExamAttemptSubmitService);
  });

  describe('submitAttempt', () => {
    it('should successfully grade and submit an in-progress exam attempt against snapshot', async () => {
      const initialAnswers: IExamAttemptAnswer[] = [];
      const attemptDoc = createMockAttempt({ answers: initialAnswers });
      const snapshotDoc = createMockQuizSnapshot();

      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(snapshotDoc),
        }),
      });

      const gradingResult: GradingResult = {
        score: 10,
        totalPoints: 10,
        correctCount: 1,
        wrongCount: 0,
        answers: [
          {
            questionId: mockQuestionId,
            selectedOptionIds: [],
            isCorrect: true,
            timeSpentSec: 30,
            answeredAt: new Date(),
          },
        ],
      };
      mockAutoGradingService.gradeAttempt.mockReturnValue(gradingResult);

      const result = await service.submitAttempt(mockOrgId, mockUserId, mockAttemptId.toString());

      expect(mockAttemptModel.findOne).toHaveBeenCalled();
      expect(mockQuizVersionModel.findOne).toHaveBeenCalledWith({
        quizId: attemptDoc.quizId,
        organizationId: attemptDoc.organizationId,
        version: attemptDoc.quizVersion,
      });
      expect(mockAutoGradingService.gradeAttempt).toHaveBeenCalledWith(
        attemptDoc.questionOrder,
        initialAnswers,
        snapshotDoc.snapshot.questions,
      );
      expect(attemptDoc.status).toBe(ExamAttemptStatus.SUBMITTED);
      expect(attemptDoc.score).toBe(10);
      expect(attemptDoc.totalPoints).toBe(10);
      expect(attemptDoc.correctCount).toBe(1);
      expect(attemptDoc.wrongCount).toBe(0);
      expect(attemptDoc.submittedAt).toBeDefined();
      expect(attemptDoc.durationSec).toBeGreaterThanOrEqual(290);
      expect(attemptDoc.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if attempt is not found', async () => {
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.submitAttempt(mockOrgId, mockUserId, mockAttemptId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if attempt is already submitted', async () => {
      const attemptDoc = createMockAttempt({ status: ExamAttemptStatus.SUBMITTED });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });

      await expect(
        service.submitAttempt(mockOrgId, mockUserId, mockAttemptId.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if snapshot version is not found', async () => {
      const attemptDoc = createMockAttempt();
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.submitAttempt(mockOrgId, mockUserId, mockAttemptId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forceSubmitExpiredAttempts', () => {
    it('should process and force-submit all expired attempts against snapshot', async () => {
      const attemptDoc = createMockAttempt();
      const snapshotDoc = createMockQuizSnapshot();

      mockAttemptModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([attemptDoc as unknown as ExamAttemptDocument]),
        }),
      });
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(snapshotDoc),
        }),
      });

      const gradingResult: GradingResult = {
        score: 10,
        totalPoints: 10,
        correctCount: 1,
        wrongCount: 0,
        answers: [],
      };
      mockAutoGradingService.gradeAttempt.mockReturnValue(gradingResult);

      const count = await service.forceSubmitExpiredAttempts();

      expect(count).toBe(1);
      expect(attemptDoc.status).toBe(ExamAttemptStatus.SUBMITTED);
      expect(attemptDoc.save).toHaveBeenCalled();
    });
  });
});
