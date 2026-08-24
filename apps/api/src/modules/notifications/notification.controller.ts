import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ApiResponse } from '../../common/response/api-response';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationService } from './notification.service';
import { Notification } from './schemas/notification.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a notification' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  async findAll(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Query() query: QueryNotificationDto,
  ): Promise<ApiResponse<Notification[]>> {
    const { items, meta } = await this.notificationService.findAll(orgId, userId, query);
    return ApiResponse.success(items, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  findOne(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<Notification> {
    return this.notificationService.findOne(id, orgId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  update(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.update(id, orgId, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification (soft delete)' })
  remove(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.notificationService.remove(id, orgId, userId);
  }
}
