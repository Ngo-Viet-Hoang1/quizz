import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClassMembersService } from './class-members.service';
import { ClassesService } from './classes.service';
import { QueryClassMemberDto } from './dto';
import { ClassMemberRole, ClassMemberStatus, ClassStatus } from './enums/class.enum';
import { ClassMember } from './schemas/class-member.schema';
import { ClassDocument } from './schemas/class.schema';

type MockModel = jest.Mock & {
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  updateOne: jest.Mock;
};

describe('ClassMembersService', () => {
  let service: ClassMembersService;
  let classesService: jest.Mocked<ClassesService>;
  let mockClassMemberModel: MockModel;

  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const studentUserId = 'user-789';
  const otherUserId = 'user-999';
  const mockClassId = new Types.ObjectId().toHexString();
  const mockMemberId = new Types.ObjectId().toHexString();

  const createMockClassDoc = (dto: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: new Types.ObjectId(mockClassId),
    organizationId: mockOrgId,
    name: dto.name ?? 'Lớp 10A1',
    ownerId: dto.ownerId ?? mockUserId,
    status: dto.status ?? ClassStatus.ACTIVE,
  });

  const createMockMemberDoc = (dto: Record<string, unknown> = {}): Record<string, unknown> => ({
    _id: new Types.ObjectId(mockMemberId),
    organizationId: mockOrgId,
    classId: new Types.ObjectId(mockClassId),
    userId: dto.userId ?? studentUserId,
    role: dto.role ?? ClassMemberRole.STUDENT,
    status: dto.status ?? ClassMemberStatus.ACTIVE,
    joinedAt: dto.joinedAt ?? new Date(),
    save: jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    }),
  });

  beforeEach(async () => {
    mockClassMemberModel = jest
      .fn()
      .mockImplementation((dto: Record<string, unknown>) =>
        createMockMemberDoc(dto),
      ) as unknown as MockModel;
    mockClassMemberModel.findOne = jest.fn();
    mockClassMemberModel.find = jest.fn();
    mockClassMemberModel.countDocuments = jest.fn();
    mockClassMemberModel.updateOne = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    const mockClassesService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassMembersService,
        { provide: getModelToken(ClassMember.name), useValue: mockClassMemberModel },
        { provide: ClassesService, useValue: mockClassesService },
      ],
    }).compile();

    service = module.get<ClassMembersService>(ClassMembersService);
    classesService = module.get(ClassesService);
  });

  describe('addMember', () => {
    it('should allow class owner to add a student to class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.addMember(mockClassId, mockOrgId, mockUserId, {
        userId: studentUserId,
        role: ClassMemberRole.STUDENT,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(studentUserId);
      expect(result.role).toBe(ClassMemberRole.STUDENT);
      expect(result.status).toBe(ClassMemberStatus.ACTIVE);
    });

    it('should throw ForbiddenException if non-owner tries to add member', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(
        service.addMember(mockClassId, mockOrgId, otherUserId, { userId: studentUserId }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if class is ARCHIVED', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId, status: ClassStatus.ARCHIVED });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(
        service.addMember(mockClassId, mockOrgId, mockUserId, { userId: studentUserId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if owner tries to add self as member', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(
        service.addMember(mockClassId, mockOrgId, mockUserId, { userId: mockUserId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reactivate existing removed member if added again', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const removedMember = createMockMemberDoc({ status: ClassMemberStatus.REMOVED });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(removedMember),
      });

      const result = await service.addMember(mockClassId, mockOrgId, mockUserId, {
        userId: studentUserId,
        role: ClassMemberRole.ASSISTANT,
      });

      expect(result.status).toBe(ClassMemberStatus.ACTIVE);
      expect(result.role).toBe(ClassMemberRole.ASSISTANT);
    });
  });

  describe('join', () => {
    it('should allow student to join active class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.join(mockClassId, mockOrgId, studentUserId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(studentUserId);
      expect(result.role).toBe(ClassMemberRole.STUDENT);
      expect(result.status).toBe(ClassMemberStatus.ACTIVE);
    });

    it('should throw BadRequestException if student joins ARCHIVED class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId, status: ClassStatus.ARCHIVED });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(service.join(mockClassId, mockOrgId, studentUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if owner tries to join own class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(service.join(mockClassId, mockOrgId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return member if already ACTIVE', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const activeMember = createMockMemberDoc({ status: ClassMemberStatus.ACTIVE });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activeMember),
      });

      const result = await service.join(mockClassId, mockOrgId, studentUserId);
      expect(result.status).toBe(ClassMemberStatus.ACTIVE);
    });
  });

  describe('removeMember', () => {
    it('should allow member to leave class on own initiative', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const activeMember = createMockMemberDoc({ status: ClassMemberStatus.ACTIVE });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activeMember),
      });

      const result = await service.removeMember(mockClassId, mockOrgId, studentUserId);
      expect(result.status).toBe(ClassMemberStatus.REMOVED);
    });

    it('should allow owner to remove student from class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const activeMember = createMockMemberDoc({ status: ClassMemberStatus.ACTIVE });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activeMember),
      });

      const result = await service.removeMember(mockClassId, mockOrgId, mockUserId, studentUserId);
      expect(result.status).toBe(ClassMemberStatus.REMOVED);
    });

    it('should throw ForbiddenException if non-owner tries to remove someone else', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(
        service.removeMember(mockClassId, mockOrgId, otherUserId, studentUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if owner tries to remove self from class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);

      await expect(
        service.removeMember(mockClassId, mockOrgId, mockUserId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if member not found in class', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.removeMember(mockClassId, mockOrgId, studentUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return member directly if already REMOVED', async () => {
      const mockClass = createMockClassDoc({ ownerId: mockUserId });
      const removedMember = createMockMemberDoc({ status: ClassMemberStatus.REMOVED });
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(removedMember),
      });

      const result = await service.removeMember(mockClassId, mockOrgId, studentUserId);
      expect(result.status).toBe(ClassMemberStatus.REMOVED);
    });
  });

  describe('getMembers', () => {
    it('should return paginated members of class', async () => {
      const mockClass = createMockClassDoc({});
      const mockMember = createMockMemberDoc({});
      classesService.findOne.mockResolvedValue(mockClass as unknown as ClassDocument);
      mockClassMemberModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockClassMemberModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockMember]),
              }),
            }),
          }),
        }),
      });

      const query = Object.assign(new QueryClassMemberDto(), {
        page: 1,
        limit: 10,
        status: ClassMemberStatus.ACTIVE,
      });

      const result = await service.getMembers(mockClassId, mockOrgId, query);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
