import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CreateClassDto, QueryClassDto } from './dto';
import { ClassStatus } from './enums/class.enum';
import { IClass } from './interfaces/class.interface';
import { Class, ClassDocument } from './schemas/class.schema';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: jest.Mocked<ClassesService>;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockClassId = '507f1f77bcf86cd799439011';

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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: mockClassesService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get(ClassesService);
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
});
