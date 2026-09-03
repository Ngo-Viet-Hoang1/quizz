import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ClassMembersService } from './class-members.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { AddClassMemberDto, CreateClassDto, QueryClassDto, UpdateClassDto } from './dto';
import { ClassMemberRole, ClassMemberStatus, ClassStatus } from './enums/class.enum';
import { IClass } from './interfaces/class.interface';
import { Class, ClassDocument } from './schemas/class.schema';
import { ClassMember } from './schemas/class-member.schema';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: jest.Mocked<ClassesService>;
  let membersService: jest.Mocked<ClassMembersService>;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const studentUserId = 'user-789';
  const mockClassId = '507f1f77bcf86cd799439011';
  const mockMemberId = '507f1f77bcf86cd799439022';

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
    };

    const mockClassMembersService = {
      addMember: jest.fn().mockResolvedValue(mockClassMember),
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
});
