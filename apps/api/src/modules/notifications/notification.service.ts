import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationDocument } from './schemas/notification.schema';

const NOTIFICATION_SORT_FIELDS = ['createdAt', 'readAt', 'type', 'title'] as const;

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(orgId: string, userId: string, dto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...dto,
      organizationId: orgId,
      userId,
      readAt: null,
      deletedAt: null,
    });
    return notification.save();
  }

  async findAll(
    orgId: string,
    userId: string,
    query: QueryNotificationDto,
  ): Promise<PaginateResult<Notification>> {
    const filter = this.buildFilter(orgId, userId, query);
    return paginate<Notification, NotificationDocument>(this.notificationModel, filter, query, {
      allowedSortFields: NOTIFICATION_SORT_FIELDS,
    });
  }

  async findOne(id: string, orgId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOne({ _id: id, organizationId: orgId, userId, deletedAt: null })
      .lean<Notification>()
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(
    id: string,
    orgId: string,
    userId: string,
    dto: UpdateNotificationDto,
  ): Promise<Notification> {
    const updated = await this.notificationModel
      .findOneAndUpdate({ _id: id, organizationId: orgId, userId, deletedAt: null }, dto, {
        new: true,
      })
      .lean<Notification>()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return updated;
  }

  async markAsRead(id: string, orgId: string, userId: string): Promise<Notification> {
    const updated = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgId, userId, deletedAt: null },
        { readAt: new Date() },
        { new: true },
      )
      .lean<Notification>()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return updated;
  }

  async markAllAsRead(orgId: string, userId: string): Promise<{ modifiedCount: number }> {
    const filter: QueryFilter<NotificationDocument> = {
      organizationId: orgId,
      userId,
      readAt: null,
      deletedAt: null,
    };
    const result = await this.notificationModel.updateMany(filter, { readAt: new Date() }).exec();
    return { modifiedCount: result.modifiedCount };
  }

  async unreadCount(orgId: string, userId: string): Promise<{ count: number }> {
    const filter: QueryFilter<NotificationDocument> = {
      organizationId: orgId,
      userId,
      readAt: null,
      deletedAt: null,
    };
    const count = await this.notificationModel.countDocuments(filter).exec();
    return { count };
  }

  async remove(
    id: string,
    orgId: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    const deleted = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgId, userId, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return { deleted: true, id };
  }

  private buildFilter(
    orgId: string,
    userId: string,
    query: QueryNotificationDto,
  ): QueryFilter<NotificationDocument> {
    const { search, type, isRead } = query;
    const filter: QueryFilter<NotificationDocument> = {
      organizationId: orgId,
      userId,
      deletedAt: null,
    };

    if (type) {
      filter.type = type;
    }

    if (isRead === true) {
      filter.readAt = { $ne: null };
    } else if (isRead === false) {
      filter.readAt = null;
    }

    if (search) {
      const safeSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { content: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    return filter;
  }
}
