import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ClassMembersService } from './class-members.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import {
  AddClassMemberDto,
  AssignQuizDto,
  CreateClassDto,
  QueryClassMemberDto,
  QueryClassDto,
  QueryQuizAssignmentDto,
  UpdateClassDto,
} from './dto';
import { ClassMemberRole, ClassMemberStatus, ClassStatus } from './enums/class.enum';
import { IClass, IClassMember, IQuizAssignment } from './interfaces/class.interface';
import { Class, ClassDocument } from './schemas/class.schema';
import { ClassMember } from './schemas/class-member.schema';
import { QuizAssignment } from './schemas/quiz-assignment.schema';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: jest.Mocked<ClassesService>;
  let membersService: jest.Mocked<ClassMembersService>;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const studentUserId = 'user-789';
  const mockClassId = '507f1f77bcf86cd799439011';
  const mockMemberId = '507f1f77bcf86cd799439022';
  const mockQuizId = '507f1f77bcf86cd799439033';
  const mockAssignmentId = '507f1f77bcf86cd799439044';

  const mockClass: Class = {
    _id: new Types.ObjectId(mockClassId),
    organizationId: mockOrgId,
    name: 'Lớp 10A1 - Hóa học',
    ownerId: mockUserId,
    status: ClassStatus.ACTIVE,
  };

  const mockIClass: IClass = {
    id: mockClassId,
    organizationId: mockOrgId,
    name: 'Lớp 10A1 - Hóa học',
    ownerId: mockUserId,
    status: ClassStatus.ACTIVE,
  };

  const mockClassMember: ClassMember = {
    _id: new Types.ObjectId(mockMemberId),
    organizationId: mockOrgId,
    classId: new Types.ObjectId(mockClassId),
    userId: studentUserId,
    role: ClassMemberRole.STUDENT,
    status: ClassMemberStatus.ACTIVE,
    joinedAt: new Date(),
  };

  const mockIClassMember: IClassMember = {
    id: mockMemberId,
    organizationId: mockOrgId,
    classId: mockClassId,
    userId: studentUserId,
    role: ClassMemberRole.STUDENT,
    status: ClassMemberStatus.ACTIVE,
    joinedAt: new Date(),
  };

  const mockQuizAssignment: QuizAssignment = {
    _id: new Types.ObjectId(mockAssignmentId),
    organizationId: mockOrgId,
    quizId: new Types.ObjectId(mockQuizId),
    quizVersion: 1,
    classId: new Types.ObjectId(mockClassId),
    assignedBy: mockUserId,
    dueAt: null,
    allowLateSubmit: false,
    createdAt: new Date(),
  };

  const mockIQuizAssignment: IQuizAssignment = {
    id: mockAssignmentId,
    organizationId: mockOrgId,
    quizId: mockQuizId,
    quizVersion: 1,
    classId: mockClassId,
    assignedBy: mockUserId,
    dueAt: null,
    allowLateSubmit: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockClassesService = {
      create: jest.fn().mockResolvedValue(mockClass),
      findAll: jest.fn().mockResolvedValue({
        items: [mockIClass],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findOwnedClasses: jest.fn().mockResolvedValue({
        items: [mockIClass],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findOne: jest.fn().mockResolvedValue(mockClass as unknown as ClassDocument),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockClass, name: 'Lớp 10A1 Nâng cao' } as unknown as Class),
      archive: jest
        .fn()
        .mockResolvedValue({ ...mockClass, status: ClassStatus.ARCHIVED } as unknown as Class),
      assignQuiz: jest.fn().mockResolvedValue(mockQuizAssignment),
      getClassAssignments: jest.fn().mockResolvedValue({
        items: [mockIQuizAssignment],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      removeAssignment: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockClassMembersService = {
      addMember: jest.fn().mockResolvedValue(mockClassMember),
      join: jest.fn().mockResolvedValue(mockClassMember),
      removeMember: jest
        .fn()
        .mockResolvedValue({ ...mockClassMember, status: ClassMemberStatus.REMOVED }),
      getMembers: jest.fn().mockResolvedValue({
        items: [mockIClassMember],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      findEnrolledClasses: jest.fn().mockResolvedValue({
        items: [mockIClass],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [
        { provide: ClassesService, useValue: mockClassesService },
        { provide: ClassMembersService, useValue: mockClassMembersService },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get(ClassesService);
    membersService = module.get(ClassMembersService);
  });

  describe('create', () => {
    it('should create and return a class', async () => {
      const dto: CreateClassDto = { name: 'Lớp 10A1 - Hóa học' };
      const result = await controller.create(mockOrgId, mockUserId, dto);

      expect(service.create).toHaveBeenCalledWith(mockOrgId, mockUserId, dto);
      expect(result).toEqual(mockClass);
    });
  });

  describe('findAll', () => {
    it('should return paginated classes wrapped in ApiResponse', async () => {
      const query = Object.assign(new QueryClassDto(), { page: 1, limit: 10 });
      const result = await controller.findAll(mockOrgId, query);

      expect(service.findAll).toHaveBeenCalledWith(mockOrgId, query);
      expect(result.data).toEqual([mockIClass]);
      expect(result.meta?.total).toBe(1);
    });
  });

  describe('findOwned', () => {
    it('should return paginated owned classes wrapped in ApiResponse', async () => {
      const query = Object.assign(new QueryClassDto(), { page: 1, limit: 10 });
      const result = await controller.findOwned(mockOrgId, mockUserId, query);

      expect(service.findOwnedClasses).toHaveBeenCalledWith(mockOrgId, mockUserId, query);
      expect(result.data).toEqual([mockIClass]);
      expect(result.meta?.total).toBe(1);
    });
  });

  describe('findEnrolled', () => {
    it('should return paginated enrolled classes wrapped in ApiResponse', async () => {
      const query = Object.assign(new QueryClassDto(), { page: 1, limit: 10 });
      const result = await controller.findEnrolled(mockOrgId, studentUserId, query);

      expect(membersService.findEnrolledClasses).toHaveBeenCalledWith(
        mockOrgId,
        studentUserId,
        query,
      );
      expect(result.data).toEqual([mockIClass]);
      expect(result.meta?.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return class by ID', async () => {
      const result = await controller.findOne(mockOrgId, mockClassId);

      expect(service.findOne).toHaveBeenCalledWith(mockClassId, mockOrgId);
      expect(result).toEqual(mockClass);
    });
  });

  describe('update', () => {
    it('should update and return updated class', async () => {
      const dto: UpdateClassDto = { name: 'Lớp 10A1 Nâng cao' };
      const result = await controller.update(mockOrgId, mockUserId, mockClassId, dto);

      expect(service.update).toHaveBeenCalledWith(mockClassId, mockOrgId, mockUserId, dto);
      expect(result.name).toBe('Lớp 10A1 Nâng cao');
    });
  });

  describe('archive', () => {
    it('should archive and return archived class', async () => {
      const result = await controller.archive(mockOrgId, mockUserId, mockClassId);

      expect(service.archive).toHaveBeenCalledWith(mockClassId, mockOrgId, mockUserId);
      expect(result.status).toBe(ClassStatus.ARCHIVED);
    });
  });

  describe('addMember', () => {
    it('should add member and return ClassMember', async () => {
      const dto: AddClassMemberDto = { userId: studentUserId, role: ClassMemberRole.STUDENT };
      const result = await controller.addMember(mockOrgId, mockUserId, mockClassId, dto);

      expect(membersService.addMember).toHaveBeenCalledWith(
        mockClassId,
        mockOrgId,
        mockUserId,
        dto,
      );
      expect(result).toEqual(mockClassMember);
    });
  });

  describe('getMembers', () => {
    it('should return paginated members wrapped in ApiResponse', async () => {
      const query = Object.assign(new QueryClassMemberDto(), { page: 1, limit: 10 });
      const result = await controller.getMembers(mockOrgId, mockClassId, query);

      expect(membersService.getMembers).toHaveBeenCalledWith(mockClassId, mockOrgId, query);
      expect(result.data).toEqual([mockIClassMember]);
      expect(result.meta?.total).toBe(1);
    });
  });

  describe('join', () => {
    it('should join class and return ClassMember', async () => {
      const result = await controller.join(mockOrgId, studentUserId, mockClassId);

      expect(membersService.join).toHaveBeenCalledWith(mockClassId, mockOrgId, studentUserId);
      expect(result).toEqual(mockClassMember);
    });
  });

  describe('leave', () => {
    it('should leave class and return ClassMember with removed status', async () => {
      const result = await controller.leave(mockOrgId, studentUserId, mockClassId);

      expect(membersService.removeMember).toHaveBeenCalledWith(
        mockClassId,
        mockOrgId,
        studentUserId,
      );
      expect(result.status).toBe(ClassMemberStatus.REMOVED);
    });
  });

  describe('removeMember', () => {
    it('should remove member by teacher and return ClassMember with removed status', async () => {
      const result = await controller.removeMember(
        mockOrgId,
        mockUserId,
        mockClassId,
        studentUserId,
      );

      expect(membersService.removeMember).toHaveBeenCalledWith(
        mockClassId,
        mockOrgId,
        mockUserId,
        studentUserId,
      );
      expect(result.status).toBe(ClassMemberStatus.REMOVED);
    });
  });

  describe('assignQuiz', () => {
    it('should assign quiz and return QuizAssignment', async () => {
      const dto: AssignQuizDto = { quizId: mockQuizId };
      const result = await controller.assignQuiz(mockOrgId, mockUserId, mockClassId, dto);

      expect(service.assignQuiz).toHaveBeenCalledWith(mockClassId, mockOrgId, mockUserId, dto);
      expect(result).toEqual(mockQuizAssignment);
    });
  });

  describe('getClassAssignments', () => {
    it('should return paginated assignments wrapped in ApiResponse', async () => {
      const query = Object.assign(new QueryQuizAssignmentDto(), { page: 1, limit: 10 });
      const result = await controller.getClassAssignments(mockOrgId, mockClassId, query);

      expect(service.getClassAssignments).toHaveBeenCalledWith(mockClassId, mockOrgId, query);
      expect(result.data).toEqual([mockIQuizAssignment]);
      expect(result.meta?.total).toBe(1);
    });
  });

  describe('removeAssignment', () => {
    it('should remove quiz assignment from class', async () => {
      const result = await controller.removeAssignment(
        mockOrgId,
        mockUserId,
        mockClassId,
        mockAssignmentId,
      );

      expect(service.removeAssignment).toHaveBeenCalledWith(
        mockClassId,
        mockAssignmentId,
        mockOrgId,
        mockUserId,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
