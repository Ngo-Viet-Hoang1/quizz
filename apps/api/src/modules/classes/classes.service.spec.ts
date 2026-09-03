import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Quiz } from '../quiz/schemas/quiz.schema';
import { ClassesService } from './classes.service';
import { AssignQuizDto, QueryClassDto, QueryQuizAssignmentDto, UpdateClassDto } from './dto';
import { ClassStatus } from './enums/class.enum';
import { Class } from './schemas/class.schema';
import { QuizAssignment } from './schemas/quiz-assignment.schema';

type MockModel = jest.Mock & {
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  updateOne: jest.Mock;
};

describe('ClassesService', () => {
  let service: ClassesService;
  let mockClassModel: MockModel;
  let mockAssignmentModel: MockModel;
  let mockQuizModel: MockModel;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const otherUserId = 'user-999';
  const mockClassId = new Types.ObjectId().toHexString();
  const mockQuizId = new Types.ObjectId().toHexString();
  const mockAssignmentId = new Types.ObjectId().toHexString();

  const createMockClassDoc = (dto: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: new Types.ObjectId(mockClassId),
    organizationId: mockOrgId,
    name: dto.name ?? 'Lớp 10A1 - Hóa học',
    ownerId: dto.ownerId ?? mockUserId,
    status: dto.status ?? ClassStatus.ACTIVE,
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
  });

  const createMockAssignmentDoc = (dto: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: new Types.ObjectId(mockAssignmentId),
    organizationId: mockOrgId,
    classId: new Types.ObjectId(mockClassId),
    quizId: new Types.ObjectId(mockQuizId),
    quizVersion: dto.quizVersion ?? 1,
    assignedBy: dto.assignedBy ?? mockUserId,
    dueAt: dto.dueAt ?? null,
    allowLateSubmit: dto.allowLateSubmit ?? false,
    createdAt: new Date(),
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
  });

  const createMockQuizDoc = (dto: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: new Types.ObjectId(mockQuizId),
    organizationId: mockOrgId,
    title: dto.title ?? 'Kiểm tra Hóa học 15p',
    version: dto.version ?? 1,
  });

  beforeEach(async () => {
    mockClassModel = jest
      .fn()
      .mockImplementation((dto: Record<string, unknown>) =>
        createMockClassDoc(dto),
      ) as unknown as MockModel;
    mockClassModel.findOne = jest.fn();
    mockClassModel.find = jest.fn();
    mockClassModel.countDocuments = jest.fn();
    mockClassModel.updateOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    mockAssignmentModel = jest
      .fn()
      .mockImplementation((dto: Record<string, unknown>) =>
        createMockAssignmentDoc(dto),
      ) as unknown as MockModel;
    mockAssignmentModel.findOne = jest.fn();
    mockAssignmentModel.find = jest.fn();
    mockAssignmentModel.countDocuments = jest.fn();

    mockQuizModel = jest
      .fn()
      .mockImplementation((dto: Record<string, unknown>) =>
        createMockQuizDoc(dto),
      ) as unknown as MockModel;
    mockQuizModel.findOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: getModelToken(Class.name), useValue: mockClassModel },
        { provide: getModelToken(QuizAssignment.name), useValue: mockAssignmentModel },
        { provide: getModelToken(Quiz.name), useValue: mockQuizModel },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  describe('create', () => {
    it('should create a class with active status and ownerId', async () => {
      const result = await service.create(mockOrgId, mockUserId, {
        name: 'Lớp 10A1 - Hóa học',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Lớp 10A1 - Hóa học');
      expect(result.status).toBe(ClassStatus.ACTIVE);
      expect(result.ownerId).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrgId);
    });
  });

  describe('findAll', () => {
    it('should return paginated classes with search and filters', async () => {
      const mockDoc = createMockClassDoc({ name: 'Lớp 10A1' });
      mockClassModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockClassModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockDoc]),
              }),
            }),
          }),
        }),
      });

      const query = Object.assign(new QueryClassDto(), {
        page: 1,
        limit: 10,
        search: '10A1',
        status: ClassStatus.ACTIVE,
      });

      const result = await service.findAll(mockOrgId, query);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOwnedClasses', () => {
    it('should return paginated classes filtered by ownerId', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockClassModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockDoc]),
              }),
            }),
          }),
        }),
      });

      const query = Object.assign(new QueryClassDto(), { page: 1, limit: 10 });
      const result = await service.findOwnedClasses(mockOrgId, mockUserId, query);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return class if found', async () => {
      const mockDoc = createMockClassDoc({});
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findOne(mockClassId, mockOrgId);
      expect(result).toBeDefined();
      expect(result._id.toHexString()).toBe(mockClassId);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockClassId, mockOrgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should allow class owner to update class details', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const dto: UpdateClassDto = { name: 'Lớp 10A1 Nâng cao' };
      const result = await service.update(mockClassId, mockOrgId, mockUserId, dto);
      expect(result.name).toBe('Lớp 10A1 Nâng cao');
    });

    it('should throw ForbiddenException if non-owner tries to update class', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(
        service.update(mockClassId, mockOrgId, otherUserId, { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('archive', () => {
    it('should allow class owner to archive active class', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId, status: ClassStatus.ACTIVE });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.archive(mockClassId, mockOrgId, mockUserId);
      expect(result.status).toBe(ClassStatus.ARCHIVED);
    });

    it('should throw ForbiddenException if non-owner tries to archive class', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(service.archive(mockClassId, mockOrgId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if class is already archived', async () => {
      const mockDoc = createMockClassDoc({ ownerId: mockUserId, status: ClassStatus.ARCHIVED });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(service.archive(mockClassId, mockOrgId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assignQuiz', () => {
    it('should allow teacher to assign quiz to class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const mockQuiz = createMockQuizDoc({});
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClass),
      });
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuiz),
      });

      const dto: AssignQuizDto = { quizId: mockQuizId };
      const result = await service.assignQuiz(mockClassId, mockOrgId, mockUserId, dto);

      expect(result).toBeDefined();
      expect(result.assignedBy).toBe(mockUserId);
      expect(result.quizVersion).toBe(1);
    });

    it('should throw ForbiddenException if non-owner assigns quiz', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClass),
      });

      await expect(
        service.assignQuiz(mockClassId, mockOrgId, otherUserId, { quizId: mockQuizId }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if quiz not found', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClass),
      });
      mockQuizModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.assignQuiz(mockClassId, mockOrgId, mockUserId, { quizId: mockQuizId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getClassAssignments', () => {
    it('should return paginated assignments of class', async () => {
      const mockClass = createMockClassDoc({});
      const mockAssignment = createMockAssignmentDoc({});
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockClass),
      });
      mockAssignmentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockAssignmentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockAssignment]),
              }),
            }),
          }),
        }),
      });

      const query = Object.assign(new QueryQuizAssignmentDto(), { page: 1, limit: 10 });
      const result = await service.getClassAssignments(mockClassId, mockOrgId, query);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
