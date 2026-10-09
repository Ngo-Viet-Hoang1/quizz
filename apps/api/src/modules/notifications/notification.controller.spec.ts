import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './schemas/notification.schema';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockNotificationService: Record<string, jest.Mock>;
  const mockOrgId = 'org_123';
  const mockUserId = 'user_clerk_123';
  const mockObjectId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockNotificationService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      unreadCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a notification scoped to org and user', async () => {
    const dto: CreateNotificationDto = {
      title: 'Test Title',
      content: 'Test Content',
      type: NotificationType.GENERAL,
    };
    const expected: Notification = {
      _id: new Types.ObjectId(mockObjectId),
      organizationId: mockOrgId,
      userId: mockUserId,
      type: NotificationType.GENERAL,
      title: 'Test Title',
      content: 'Test Content',
    };
    mockNotificationService.create.mockResolvedValue(expected);

    const result = await controller.create(mockOrgId, mockUserId, dto);
    expect(result).toEqual(expected);
    expect(mockNotificationService.create).toHaveBeenCalledWith(mockOrgId, mockUserId, dto);
  });

  it('should get all notifications wrapped in ApiResponse', async () => {
    const query: QueryNotificationDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    const items = [
      {
        _id: new Types.ObjectId(mockObjectId),
        organizationId: mockOrgId,
        userId: mockUserId,
        title: 'Item 1',
        content: 'Content 1',
        type: NotificationType.SYSTEM,
      },
    ];
    const meta = { page: 1, limit: 10, total: 1, totalPages: 1 };
    mockNotificationService.findAll.mockResolvedValue({ items, meta });

    const result = await controller.findAll(mockOrgId, mockUserId, query);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(items);
    expect(result.meta).toEqual(meta);
    expect(mockNotificationService.findAll).toHaveBeenCalledWith(mockOrgId, mockUserId, query);
  });

  it('should get unread notification count for current user', async () => {
    mockNotificationService.unreadCount.mockResolvedValue({ count: 4 });

    const result = await controller.unreadCount(mockOrgId, mockUserId);
    expect(result).toEqual({ count: 4 });
    expect(mockNotificationService.unreadCount).toHaveBeenCalledWith(mockOrgId, mockUserId);
  });

  it('should mark all notifications as read for current user', async () => {
    mockNotificationService.markAllAsRead.mockResolvedValue({ modifiedCount: 3 });

    const result = await controller.markAllAsRead(mockOrgId, mockUserId);
    expect(result).toEqual({ modifiedCount: 3 });
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(mockOrgId, mockUserId);
  });

  it('should find one notification by id', async () => {
    const item = { _id: new Types.ObjectId(mockObjectId), title: 'Item 1' };
    mockNotificationService.findOne.mockResolvedValue(item);

    const result = await controller.findOne(mockOrgId, mockUserId, mockObjectId);
    expect(result).toEqual(item);
    expect(mockNotificationService.findOne).toHaveBeenCalledWith(
      mockObjectId,
      mockOrgId,
      mockUserId,
    );
  });

  it('should update a notification', async () => {
    const dto: UpdateNotificationDto = { title: 'New Title' };
    const updated = { _id: new Types.ObjectId(mockObjectId), title: 'New Title' };
    mockNotificationService.update.mockResolvedValue(updated);

    const result = await controller.update(mockOrgId, mockUserId, mockObjectId, dto);
    expect(result).toEqual(updated);
    expect(mockNotificationService.update).toHaveBeenCalledWith(
      mockObjectId,
      mockOrgId,
      mockUserId,
      dto,
    );
  });

  it('should mark a notification as read', async () => {
    const read = { _id: new Types.ObjectId(mockObjectId), readAt: new Date() };
    mockNotificationService.markAsRead.mockResolvedValue(read);

    const result = await controller.markAsRead(mockOrgId, mockUserId, mockObjectId);
    expect(result).toEqual(read);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(
      mockObjectId,
      mockOrgId,
      mockUserId,
    );
  });

  it('should delete a notification', async () => {
    mockNotificationService.remove.mockResolvedValue({ deleted: true, id: mockObjectId });

    const result = await controller.remove(mockOrgId, mockUserId, mockObjectId);
    expect(result).toEqual({ deleted: true, id: mockObjectId });
    expect(mockNotificationService.remove).toHaveBeenCalledWith(
      mockObjectId,
      mockOrgId,
      mockUserId,
    );
  });
});
