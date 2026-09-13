import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassMember } from '../../classes/schemas/class-member.schema';
import { QuizAssignment } from '../../classes/schemas/quiz-assignment.schema';
import { QuestionType, QuizStatus } from '../../quiz/enums';
import { QuizVersion } from '../../quiz/schemas/quiz-version.schema';
import { Quiz } from '../../quiz/schemas/quiz.schema';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { ExamAttempt } from '../schemas/exam-attempt.schema';
import { ExamAttemptStartService } from './exam-attempt-start.service';

describe('ExamAttemptStartService', () => {
  let service: ExamAttemptStartService;
  let mockAttemptModel: {
    (data: Record<string, unknown>): unknown;
    findOne: jest.Mock;
    exists: jest.Mock;
  };
  let mockQuizModel: { findOne: jest.Mock };
  let mockQuizVersionModel: { findOne: jest.Mock };
  let mockAssignmentModel: { findOne: jest.Mock };
  let mockClassMemberModel: { findOne: jest.Mock; exists: jest.Mock };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockQuizId = new Types.ObjectId();
  const mockQuestionId1 = new Types.ObjectId();
  const mockQuestionId2 = new Types.ObjectId();
  const mockOptionId1 = new Types.ObjectId();

  const mockQuizDoc = {
    _id: mockQuizId,
    organizationId: mockOrgId,
    title: 'Biology Quiz',
    status: QuizStatus.PUBLISHED,
    version: 2,
    timeLimitSec: 1800,
  };

  const mockQuizVersionDoc = {
    _id: new Types.ObjectId(),
    quizId: mockQuizId,
    organizationId: mockOrgId,
    version: 2,
    snapshot: {
      title: 'Biology Quiz',
      timeLimitSec: 1800,
      questions: [
        {
          _id: mockQuestionId1,
          type: QuestionType.SINGLE_CHOICE,
          content: 'What is photosynthesis?',
          points: 2,
          orderIndex: 0,
          options: [
            { _id: mockOptionId1, content: 'Process of plants making food', isCorrect: true },
          ],
          explanation: 'Detailed explanation here',
          metadata: { correctText: 'Photosynthesis' },
        },
        {
          _id: mockQuestionId2,
          type: QuestionType.TRUE_FALSE,
          content: 'Plants need sunlight?',
          points: 1,
          orderIndex: 1,
          options: [],
        },
      ],
    },
  };

  beforeEach(async () => {
    const createInstanceMock = jest
      .fn()
      .mockImplementation((data: Record<string, unknown>): Record<string, unknown> => ({
        ...data,
        _id: new Types.ObjectId(),
        save: jest.fn().mockResolvedValue({
          ...data,
          _id: new Types.ObjectId(),
        }),
      }));

    mockAttemptModel = Object.assign(createInstanceMock, {
      findOne: jest.fn(),
      exists: jest.fn(),
    });

    mockQuizModel = {
      findOne: jest.fn(),
    };

    mockQuizVersionModel = {
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockQuizVersionDoc),
          }),
        }),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockQuizVersionDoc),
        }),
      }),
    };

    mockAssignmentModel = {
      findOne: jest.fn(),
    };

    mockClassMemberModel = {
      findOne: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamAttemptStartService,
        { provide: getModelToken(ExamAttempt.name), useValue: mockAttemptModel },
        { provide: getModelToken(Quiz.name), useValue: mockQuizModel },
        { provide: getModelToken(QuizVersion.name), useValue: mockQuizVersionModel },
        { provide: getModelToken(QuizAssignment.name), useValue: mockAssignmentModel },
        { provide: getModelToken(ClassMember.name), useValue: mockClassMemberModel },
      ],
    }).compile();

    service = module.get<ExamAttemptStartService>(ExamAttemptStartService);
  });

  describe('Practice mode', () => {
    it('should successfully start a new practice attempt for a published quiz', async () => {
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizDoc),
      });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.startAttempt(mockOrgId, mockUserId, {
        quizId: mockQuizId.toString(),
      });

      expect(result.quizTitle).toBe('Biology Quiz');
      expect(result.questions).toHaveLength(2);
      const q1 = result.questions.find((q) => q._id === mockQuestionId1.toString());
      expect(q1).toBeDefined();
      const q1Record = q1 as unknown as Record<string, unknown>;
      const optRecord = q1?.options?.[0] as unknown as Record<string, unknown>;
      expect(optRecord.isCorrect).toBeUndefined();
      expect(q1Record.explanation).toBeUndefined();
      expect(q1Record.metadata).toBeUndefined();
      expect(result.attempt.status).toBe(ExamAttemptStatus.IN_PROGRESS);
    });

    it('should throw BadRequestException if quiz is in draft status', async () => {
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockQuizDoc,
          status: QuizStatus.DRAFT,
        }),
      });

      await expect(
        service.startAttempt(mockOrgId, mockUserId, { quizId: mockQuizId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if quiz has no published snapshot versions', async () => {
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizDoc),
      });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockQuizVersionModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        service.startAttempt(mockOrgId, mockUserId, { quizId: mockQuizId.toString() }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should resume existing active in-progress attempt with snapshot at start time', async () => {
      const existingAttempt = {
        _id: new Types.ObjectId(),
        organizationId: mockOrgId,
        userId: mockUserId,
        quizId: mockQuizId,
        quizVersion: 2,
        status: ExamAttemptStatus.IN_PROGRESS,
        questionOrder: [mockQuestionId2, mockQuestionId1],
        expiresAt: new Date(Date.now() + 1000 * 600),
      };

      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizDoc),
      });
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingAttempt),
      });
      mockQuizVersionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockQuizVersionDoc),
        }),
      });

      const result = await service.startAttempt(mockOrgId, mockUserId, {
        quizId: mockQuizId.toString(),
      });

      expect(result.attempt).toEqual(existingAttempt);
      expect(result.questions[0]._id).toBe(mockQuestionId2.toString());
      expect(mockQuizVersionModel.findOne).toHaveBeenCalledWith({
        quizId: existingAttempt.quizId,
        organizationId: mockOrgId,
        version: existingAttempt.quizVersion,
      });
    });
  });

  describe('Assigned exam mode', () => {
    const mockAssignmentId = new Types.ObjectId();
    const mockClassId = new Types.ObjectId();

    const mockAssignmentDoc = {
      _id: mockAssignmentId,
      organizationId: mockOrgId,
      quizId: mockQuizId,
      quizVersion: 2,
      classId: mockClassId,
      dueAt: new Date(Date.now() + 1000 * 3600),
      allowLateSubmit: false,
    };

    it('should throw NotFoundException if assignment is not found', async () => {
      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.startAttempt(mockOrgId, mockUserId, {
          assignmentId: mockAssignmentId.toString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not an active class member', async () => {
      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignmentDoc),
      });
      mockClassMemberModel.exists.mockResolvedValue(null);

      await expect(
        service.startAttempt(mockOrgId, mockUserId, {
          assignmentId: mockAssignmentId.toString(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignment deadline passed without late submit', async () => {
      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAssignmentDoc,
          dueAt: new Date(Date.now() - 1000 * 3600),
        }),
      });
      mockClassMemberModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(
        service.startAttempt(mockOrgId, mockUserId, {
          assignmentId: mockAssignmentId.toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already submitted the assignment', async () => {
      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignmentDoc),
      });
      mockClassMemberModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
      mockAttemptModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(
        service.startAttempt(mockOrgId, mockUserId, {
          assignmentId: mockAssignmentId.toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
