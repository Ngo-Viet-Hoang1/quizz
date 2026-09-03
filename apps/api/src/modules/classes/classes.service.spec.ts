import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassesService } from './classes.service';
import { ClassStatus } from './enums/class.enum';
import { Class } from './schemas/class.schema';

type MockModel = jest.Mock & {
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  updateOne: jest.Mock;
};

describe('ClassesService', () => {
  let service: ClassesService;
  let mockClassModel: MockModel;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockClassId = new Types.ObjectId().toHexString();

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassesService, { provide: getModelToken(Class.name), useValue: mockClassModel }],
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
});
