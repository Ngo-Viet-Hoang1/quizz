import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  QuizAssignment,
  QuizAssignmentDocument,
} from '../../classes/schemas/quiz-assignment.schema';
import { QuestionDifficulty, QuestionType } from '../../quiz/enums';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { QueryExamAttemptDto } from '../dto/query-exam-attempt.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { SanitizedQuestion } from '../interfaces/exam-attempt.interface';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';
import { ExamAttemptQueryService } from './exam-attempt-query.service';

describe('ExamAttemptQueryService', () => {
  let service: ExamAttemptQueryService;
  let mockAttemptModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findOne: jest.Mock;
  };
  let mockQuizModel: {
    findOne: jest.Mock;
  };
  let mockAssignmentModel: {
    findOne: jest.Mock;
  };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_456';
  const mockAttemptId = new Types.ObjectId();
  const mockQuizId = new Types.ObjectId();
  const mockAssignmentId = new Types.ObjectId();
  const mockQuestionId = new Types.ObjectId();

  beforeEach(async () => {
    mockAttemptModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOne: jest.fn(),
    };
    mockQuizModel = {
      findOne: jest.fn(),
    };
    mockAssignmentModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamAttemptQueryService,
        { provide: getModelToken(ExamAttempt.name), useValue: mockAttemptModel },
        { provide: getModelToken(Quiz.name), useValue: mockQuizModel },
        { provide: getModelToken(QuizAssignment.name), useValue: mockAssignmentModel },
      ],
    }).compile();

    service = module.get<ExamAttemptQueryService>(ExamAttemptQueryService);
  });

  describe('getMyHistory', () => {
    it('should query attempts with pagination and return items with meta', async () => {
      const mockAttempts = [
        {
          _id: mockAttemptId,
          organizationId: mockOrgId,
          userId: mockUserId,
          score: 8,
          totalPoints: 10,
        },
      ];

      const findQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAttempts),
        }),
      };

      mockAttemptModel.find.mockReturnValue(findQuery);
      mockAttemptModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const query: QueryExamAttemptDto = {
        page: 1,
        limit: 10,
        sortBy: 'score',
        sortOrder: 'desc',
        quizId: mockQuizId.toString(),
        status: ExamAttemptStatus.SUBMITTED,
      };

      const result = await service.getMyHistory(mockOrgId, mockUserId, query);

      expect(mockAttemptModel.find).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('getAttemptDetail', () => {
    const fullQuestions = [
      {
        _id: mockQuestionId,
        type: QuestionType.SINGLE_CHOICE,
        content: 'Sample Question',
        explanation: 'Detailed explanation for review',
        points: 2,
        difficulty: QuestionDifficulty.EASY,
        options: [
          { _id: new Types.ObjectId(), content: 'Option A', isCorrect: true },
          { _id: new Types.ObjectId(), content: 'Option B', isCorrect: false },
        ],
      },
    ];

    it('should return full questions with answers for submitted attempt', async () => {
      const attemptDoc = {
        _id: mockAttemptId,
        organizationId: mockOrgId,
        userId: mockUserId,
        quizId: mockQuizId,
        status: ExamAttemptStatus.SUBMITTED,
        score: 2,
      };

      const quizDoc = {
        _id: mockQuizId,
        organizationId: mockOrgId,
        title: 'Midterm Exam',
        questions: fullQuestions,
      };

      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(quizDoc as unknown as QuizDocument),
      });

      const result = await service.getAttemptDetail(
        mockOrgId,
        mockUserId,
        mockAttemptId.toString(),
      );

      expect(result.attempt).toBeDefined();
      expect(result.quizTitle).toBe('Midterm Exam');
      expect(result.questions).toHaveLength(1);
      expect((result.questions[0] as (typeof fullQuestions)[0]).explanation).toBe(
        'Detailed explanation for review',
      );
      expect((result.questions[0] as (typeof fullQuestions)[0]).options?.[0].isCorrect).toBe(true);
    });

    it('should return sanitized questions without correct answers for in-progress attempt', async () => {
      const attemptDoc = {
        _id: mockAttemptId,
        organizationId: mockOrgId,
        userId: mockUserId,
        quizId: mockQuizId,
        status: ExamAttemptStatus.IN_PROGRESS,
      };

      const quizDoc = {
        _id: mockQuizId,
        organizationId: mockOrgId,
        title: 'Midterm Exam',
        questions: fullQuestions,
      };

      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(quizDoc as unknown as QuizDocument),
      });

      const result = await service.getAttemptDetail(
        mockOrgId,
        mockUserId,
        mockAttemptId.toString(),
      );

      const sanitizedQuestion = result.questions[0] as SanitizedQuestion;
      expect(
        (sanitizedQuestion as unknown as { explanation?: string }).explanation,
      ).toBeUndefined();
      expect(
        (sanitizedQuestion.options?.[0] as unknown as { isCorrect?: boolean }).isCorrect,
      ).toBeUndefined();
    });

    it('should throw NotFoundException if attempt does not exist', async () => {
      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getAttemptDetail(mockOrgId, mockUserId, mockAttemptId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      const attemptDoc = {
        _id: mockAttemptId,
        organizationId: mockOrgId,
        userId: mockUserId,
        quizId: mockQuizId,
      };

      mockAttemptModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(attemptDoc as unknown as ExamAttemptDocument),
      });
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getAttemptDetail(mockOrgId, mockUserId, mockAttemptId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssignmentGradebook', () => {
    it('should return paginated attempts for a class quiz assignment', async () => {
      const assignmentDoc = {
        _id: mockAssignmentId,
        organizationId: mockOrgId,
      };

      const mockAttempts = [
        {
          _id: mockAttemptId,
          organizationId: mockOrgId,
          assignmentId: mockAssignmentId,
          userId: mockUserId,
          score: 10,
        },
      ];

      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(assignmentDoc as unknown as QuizAssignmentDocument),
      });

      const findQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAttempts),
        }),
      };

      mockAttemptModel.find.mockReturnValue(findQuery);
      mockAttemptModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const query: PaginationQueryDto = { page: 1, limit: 10, sortBy: 'score', sortOrder: 'desc' };
      const result = await service.getAssignmentGradebook(
        mockOrgId,
        mockAssignmentId.toString(),
        query,
      );

      expect(mockAssignmentModel.findOne).toHaveBeenCalled();
      expect(mockAttemptModel.find).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if assignment does not exist', async () => {
      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const query: PaginationQueryDto = { page: 1, limit: 10, sortBy: 'score', sortOrder: 'desc' };
      await expect(
        service.getAssignmentGradebook(mockOrgId, mockAssignmentId.toString(), query),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
