import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  QuestionDifficulty,
  QuestionType,
  QuizDifficulty,
  QuizSourceType,
  QuizStatus,
  QuizVisibility,
} from './enums';
import { QuizVersionService } from './quiz-version.service';
import { QuizService } from './quiz.service';
import { Quiz } from './schemas/quiz.schema';

type MockQuizModel = jest.Mock & {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findOneAndUpdate: jest.Mock;
  countDocuments: jest.Mock;
};

describe('QuizService', () => {
  let service: QuizService;
  let mockQuizModel: MockQuizModel;
  let mockQuizVersionService: { freezeSnapshot: jest.Mock };

  const mockOrgId = 'org_123';
  const mockUserId = 'user_abc';
  const mockQuizId = new Types.ObjectId().toHexString();

  const createMockQuizDoc = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: mockQuizId,
    organizationId: mockOrgId,
    ownerId: mockUserId,
    title: 'Sample Quiz',
    description: 'Sample Description',
    category: 'Math',
    difficulty: QuizDifficulty.MEDIUM,
    sourceType: QuizSourceType.MANUAL,
    visibility: QuizVisibility.PRIVATE,
    status: QuizStatus.DRAFT,
    version: 1,
    activeRoomCount: 0,
    deletedAt: null,
    questions: [
      {
        _id: new Types.ObjectId(),
        type: QuestionType.SINGLE_CHOICE,
        content: 'What is 2 + 2?',
        difficulty: QuestionDifficulty.MEDIUM,
        points: 1,
        options: [
          { _id: new Types.ObjectId(), content: '3', isCorrect: false },
          { _id: new Types.ObjectId(), content: '4', isCorrect: true },
        ],
      },
    ],
    questionCount: 1,
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  beforeEach(async () => {
    const modelConstructor = jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: mockQuizId }),
    }));

    mockQuizModel = Object.assign(modelConstructor, {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    });

    mockQuizVersionService = {
      freezeSnapshot: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getModelToken(Quiz.name),
          useValue: mockQuizModel,
        },
        {
          provide: QuizVersionService,
          useValue: mockQuizVersionService,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  describe('create', () => {
    it('should create a quiz with DRAFT status, orgId, and userId as ownerId', async () => {
      const dto = {
        title: 'New Quiz',
        description: 'Quiz desc',
        category: 'Science',
        questions: [
          {
            content: 'Is Earth round?',
            type: QuestionType.TRUE_FALSE,
            options: [
              { content: 'True', isCorrect: true },
              { content: 'False', isCorrect: false },
            ],
          },
        ],
      };

      const result = await service.create(mockOrgId, mockUserId, dto);

      expect(mockQuizModel).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          ownerId: mockUserId,
          status: QuizStatus.DRAFT,
          title: 'New Quiz',
          questionCount: 1,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a quiz if found within organization', async () => {
      const mockDoc = createMockQuizDoc();
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const result = await service.findOne(mockQuizId, mockOrgId);
      expect(result).toEqual(mockDoc);
      expect(mockQuizModel.findOne).toHaveBeenCalledWith({
        _id: mockQuizId,
        organizationId: mockOrgId,
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(mockQuizId, mockOrgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update draft quiz without bumping version or creating snapshot', async () => {
      const draftDoc = createMockQuizDoc({ status: QuizStatus.DRAFT, version: 1 });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(draftDoc),
        }),
      });

      const updatedDoc = { ...draftDoc, title: 'Updated Draft Title' };
      mockQuizModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedDoc),
        }),
      });

      const result = await service.update(mockQuizId, mockOrgId, { title: 'Updated Draft Title' });

      expect(result.title).toBe('Updated Draft Title');
      expect(mockQuizModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockQuizId, organizationId: mockOrgId, deletedAt: null },
        expect.objectContaining({ version: 1, title: 'Updated Draft Title' }),
        { new: true },
      );
      expect(mockQuizVersionService.freezeSnapshot).not.toHaveBeenCalled();
    });

    it('should bump version and freeze snapshot when updating a PUBLISHED quiz', async () => {
      const publishedDoc = createMockQuizDoc({ status: QuizStatus.PUBLISHED, version: 1 });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(publishedDoc),
        }),
      });

      const updatedDoc = { ...publishedDoc, title: 'Updated Published Title', version: 2 };
      mockQuizModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedDoc),
        }),
      });

      const result = await service.update(mockQuizId, mockOrgId, {
        title: 'Updated Published Title',
      });

      expect(result.version).toBe(2);
      expect(mockQuizModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockQuizId, organizationId: mockOrgId, deletedAt: null },
        expect.objectContaining({ version: 2, title: 'Updated Published Title' }),
        { new: true },
      );
      expect(mockQuizVersionService.freezeSnapshot).toHaveBeenCalledWith(updatedDoc, 2);
    });
  });

  describe('publish', () => {
    it('should throw NotFoundException if quiz not found', async () => {
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.publish(mockQuizId, mockOrgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if quiz has 0 questions', async () => {
      const mockDoc = createMockQuizDoc({ questions: [], questionCount: 0 });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await expect(service.publish(mockQuizId, mockOrgId)).rejects.toThrow(BadRequestException);
      await expect(service.publish(mockQuizId, mockOrgId)).rejects.toThrow(
        'Cannot publish a quiz with no questions',
      );
    });

    it('should throw BadRequestException if a choice question has no correct option', async () => {
      const mockDoc = createMockQuizDoc({
        questions: [
          {
            type: QuestionType.SINGLE_CHOICE,
            content: 'Invalid Question',
            options: [
              { content: 'A', isCorrect: false },
              { content: 'B', isCorrect: false },
            ],
          },
        ],
      });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await expect(service.publish(mockQuizId, mockOrgId)).rejects.toThrow(BadRequestException);
      await expect(service.publish(mockQuizId, mockOrgId)).rejects.toThrow(
        'Question "Invalid Question" has invalid answer configuration',
      );
    });

    it('should freeze snapshot in quiz_versions and update status to PUBLISHED', async () => {
      const mockDoc = createMockQuizDoc({ version: 1 });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const publishedDoc = { ...mockDoc, status: QuizStatus.PUBLISHED };
      mockQuizModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(publishedDoc),
        }),
      });

      const result = await service.publish(mockQuizId, mockOrgId);

      expect(result.status).toBe(QuizStatus.PUBLISHED);
      expect(mockQuizVersionService.freezeSnapshot).toHaveBeenCalledWith(mockDoc, 1);
      expect(mockQuizModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockQuizId, organizationId: mockOrgId, deletedAt: null },
        { status: QuizStatus.PUBLISHED },
        { new: true },
      );
    });
  });

  describe('clone', () => {
    it('should clone a quiz and assign current user as the owner in DRAFT status', async () => {
      const originalQuiz = createMockQuizDoc({ ownerId: 'original_creator_id' });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(originalQuiz),
        }),
      });

      const cloningUserId = 'new_cloning_user';
      const result = await service.clone(mockQuizId, mockOrgId, cloningUserId);

      expect(mockQuizModel).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          ownerId: cloningUserId,
          title: 'Sample Quiz (Copy)',
          status: QuizStatus.DRAFT,
          questionCount: 1,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('share', () => {
    it('should return existing share code if present', async () => {
      const mockDoc = createMockQuizDoc({ shareCode: 'existing123' });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const result = await service.share(mockQuizId, mockOrgId);
      expect(result).toEqual({
        shareCode: 'existing123',
        shareUrl: '/quizzes/shared/existing123',
      });
      expect(mockQuizModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should atomically generate and update share code if null', async () => {
      const mockDoc = createMockQuizDoc({ shareCode: null });
      mockQuizModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      mockQuizModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockDoc, shareCode: 'gen12345' }),
        }),
      });

      const result = await service.share(mockQuizId, mockOrgId);
      expect(result.shareCode).toBe('gen12345');
      expect(result.shareUrl).toBe('/quizzes/shared/gen12345');
      expect(mockQuizModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockQuizId,
          organizationId: mockOrgId,
          deletedAt: null,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({ shareCode: expect.any(String) }),
        }),
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('should soft delete quiz by setting deletedAt', async () => {
      mockQuizModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: mockQuizId }),
        }),
      });

      const result = await service.remove(mockQuizId, mockOrgId);
      expect(result).toEqual({ deleted: true, id: mockQuizId });
      expect(mockQuizModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockQuizId, organizationId: mockOrgId, deletedAt: null },
        { deletedAt: expect.any(Date) },
      );
    });
  });
});
