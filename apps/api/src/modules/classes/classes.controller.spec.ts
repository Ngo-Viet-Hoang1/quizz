import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto';
import { ClassStatus } from './enums/class.enum';
import { Class } from './schemas/class.schema';

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

  beforeEach(async () => {
    const mockClassesService = {
      create: jest.fn().mockResolvedValue(mockClass),
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
});
