import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './schemas/notification.schema';

interface MockQuery {
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  populate: jest.Mock;
  lean: jest.Mock;
  exec: jest.Mock;
}

describe('NotificationService', () => {
  let service: NotificationService;
  const mockOrgId = 'org_123';
  const mockUserId = 'user_clerk_123';
  const mockObjectId = new Types.ObjectId().toString();

  function createMockQuery(returnValue: unknown): MockQuery {
    const query: MockQuery = {
      sort: jest.fn(),
      skip: jest.fn(),
      limit: jest.fn(),
      populate: jest.fn(),
      lean: jest.fn(),
      exec: jest.fn().mockResolvedValue(returnValue),
    };
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.populate.mockReturnValue(query);
    query.lean.mockReturnValue(query);
    return query;
  }

  const mockModelMethods = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  };

  class MockNotificationModel {
    public data: Record<string, unknown>;
    public save: jest.Mock;

    constructor(data: Record<string, unknown>) {
      this.data = data;
      this.save = jest.fn().mockResolvedValue({ _id: mockObjectId, ...data });
    }

    static find = mockModelMethods.find;
    static findOne = mockModelMethods.findOne;
    static findOneAndUpdate = mockModelMethods.findOneAndUpdate;
    static countDocuments = mockModelMethods.countDocuments;
    static updateMany = mockModelMethods.updateMany;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: MockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification scoped to org and user', async () => {
      const dto: CreateNotificationDto = {
        type: NotificationType.QUIZ_INVITATION,
        title: 'Quiz Invite',
        content: 'You are invited to Quiz A',
      };

      const result = await service.create(mockOrgId, mockUserId, dto);
      expect(result).toHaveProperty('_id', mockObjectId);
      expect(result).toHaveProperty('organizationId', mockOrgId);
      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('title', 'Quiz Invite');
    });
  });

  describe('findAll', () => {
    it('should find all notifications with paginate util and filters', async () => {
      const mockItems = [
        {
          _id: mockObjectId,
          title: 'Notice 1',
          content: 'Content 1',
          organizationId: mockOrgId,
          userId: mockUserId,
        },
      ];
      mockModelMethods.find.mockReturnValue(createMockQuery(mockItems));
      mockModelMethods.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const query: QueryNotificationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'Notice',
        type: NotificationType.SYSTEM,
        isRead: false,
      };

      const result = await service.findAll(mockOrgId, mockUserId, query);

      expect(result.items).toEqual(mockItems);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(mockModelMethods.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          userId: mockUserId,
          deletedAt: null,
          type: NotificationType.SYSTEM,
          readAt: null,
          $or: [
            { title: { $regex: 'Notice', $options: 'i' } },
            { content: { $regex: 'Notice', $options: 'i' } },
          ],
        }),
        undefined,
      );
    });

    it('should filter by isRead = true when provided', async () => {
      mockModelMethods.find.mockReturnValue(createMockQuery([]));
      mockModelMethods.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const query: QueryNotificationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isRead: true,
      };

      await service.findAll(mockOrgId, mockUserId, query);

      expect(mockModelMethods.find).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrgId,
          userId: mockUserId,
          deletedAt: null,
          readAt: { $ne: null },
        }),
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should find one notification by ID scoped to org and user', async () => {
      const mockItem = { _id: mockObjectId, title: 'Notice 1' };
      mockModelMethods.findOne.mockReturnValue(createMockQuery(mockItem));

      const result = await service.findOne(mockObjectId, mockOrgId, mockUserId);
      expect(result).toEqual(mockItem);
      expect(mockModelMethods.findOne).toHaveBeenCalledWith({
        _id: mockObjectId,
        organizationId: mockOrgId,
        userId: mockUserId,
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if findOne does not find notification', async () => {
      mockModelMethods.findOne.mockReturnValue(createMockQuery(null));

      await expect(service.findOne(mockObjectId, mockOrgId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a notification scoped to org and user', async () => {
      const dto: UpdateNotificationDto = { title: 'Updated Notice' };
      const mockItem = { _id: mockObjectId, title: 'Updated Notice' };
      mockModelMethods.findOneAndUpdate.mockReturnValue(createMockQuery(mockItem));

      const result = await service.update(mockObjectId, mockOrgId, mockUserId, dto);
      expect(result).toEqual(mockItem);
      expect(mockModelMethods.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockObjectId, organizationId: mockOrgId, userId: mockUserId, deletedAt: null },
        dto,
        { new: true },
      );
    });

    it('should throw NotFoundException if update target is not found', async () => {
      mockModelMethods.findOneAndUpdate.mockReturnValue(createMockQuery(null));

      await expect(
        service.update(mockObjectId, mockOrgId, mockUserId, { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read with current timestamp', async () => {
      const mockItem = { _id: mockObjectId, readAt: new Date() };
      mockModelMethods.findOneAndUpdate.mockReturnValue(createMockQuery(mockItem));

      const result = await service.markAsRead(mockObjectId, mockOrgId, mockUserId);
      expect(result).toEqual(mockItem);
      expect(mockModelMethods.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockObjectId, organizationId: mockOrgId, userId: mockUserId, deletedAt: null },
        { readAt: expect.any(Date) },
        { new: true },
      );
    });

    it('should throw NotFoundException if notification to mark as read is not found', async () => {
      mockModelMethods.findOneAndUpdate.mockReturnValue(createMockQuery(null));

      await expect(service.markAsRead(mockObjectId, mockOrgId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for current user and org', async () => {
      mockModelMethods.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 5 }),
      });

      const result = await service.markAllAsRead(mockOrgId, mockUserId);
      expect(result).toEqual({ modifiedCount: 5 });
      expect(mockModelMethods.updateMany).toHaveBeenCalledWith(
        {
          organizationId: mockOrgId,
          userId: mockUserId,
          readAt: null,
          deletedAt: null,
        },
        { readAt: expect.any(Date) },
      );
    });
  });

  describe('unreadCount', () => {
    it('should get unread count for current user and org', async () => {
      mockModelMethods.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(3),
      });

      const result = await service.unreadCount(mockOrgId, mockUserId);
      expect(result).toEqual({ count: 3 });
      expect(mockModelMethods.countDocuments).toHaveBeenCalledWith({
        organizationId: mockOrgId,
        userId: mockUserId,
        readAt: null,
        deletedAt: null,
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a notification', async () => {
      mockModelMethods.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: mockObjectId, deletedAt: new Date() }),
      });

      const result = await service.remove(mockObjectId, mockOrgId, mockUserId);
      expect(result).toEqual({ deleted: true, id: mockObjectId });
      expect(mockModelMethods.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockObjectId, organizationId: mockOrgId, userId: mockUserId, deletedAt: null },
        { deletedAt: expect.any(Date) },
        { new: true },
      );
    });

    it('should throw NotFoundException if notification to delete is not found', async () => {
      mockModelMethods.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(mockObjectId, mockOrgId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
