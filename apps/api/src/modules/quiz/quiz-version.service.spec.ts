import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QuizVersionService } from './quiz-version.service';
import { QuizVersion } from './schemas/quiz-version.schema';
import { Quiz } from './schemas/quiz.schema';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from './enums';

describe('QuizVersionService', () => {
  let service: QuizVersionService;
  let mockQuizVersionModel: { updateOne: jest.Mock };

  const mockOrgId = 'org_123';
  const mockQuizId = new Types.ObjectId().toHexString();

  const mockQuiz: Quiz = {
    _id: new Types.ObjectId(mockQuizId),
    organizationId: mockOrgId,
    ownerId: 'user_1',
    title: 'Sample Quiz',
    difficulty: QuizDifficulty.MEDIUM,
    sourceType: QuizSourceType.MANUAL,
    visibility: QuizVisibility.PRIVATE,
    status: QuizStatus.PUBLISHED,
    version: 1,
    activeRoomCount: 0,
    questions: [],
    questionCount: 0,
  };

  beforeEach(async () => {
    mockQuizVersionModel = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizVersionService,
        {
          provide: getModelToken(QuizVersion.name),
          useValue: mockQuizVersionModel,
        },
      ],
    }).compile();

    service = module.get<QuizVersionService>(QuizVersionService);
  });

  describe('freezeSnapshot', () => {
    it('should upsert quiz snapshot in quiz_versions collection', async () => {
      await service.freezeSnapshot(mockQuiz, 1);

      expect(mockQuizVersionModel.updateOne).toHaveBeenCalledWith(
        { quizId: new Types.ObjectId(mockQuizId), version: 1 },
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            quizId: new Types.ObjectId(mockQuizId),
            organizationId: mockOrgId,
            version: 1,
            snapshot: expect.objectContaining({ title: 'Sample Quiz' }),
          }),
        }),
        { upsert: true },
      );
    });
  });
});
