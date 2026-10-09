import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  HostRoomsStatsResponse,
  RoomCreatedResponse,
  RoomPublicStatusResponse,
} from '@repo/shared-types';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ApiResponse } from '../../common/response/api-response';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResult } from './schemas/room-result.schema';
import { RoomService } from './services/room.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @Audit('room.create')
  @ApiOperation({ summary: 'Create a live quiz room' })
  async createRoom(
    @CurrentUser('_id') userId: string,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateRoomDto,
  ): Promise<ApiResponse<RoomCreatedResponse>> {
    const result = await this.roomService.createRoom(
      userId,
      orgId,
      dto.quizId,
      dto.quizVersion,
      dto.timeLimitSec,
    );
    return ApiResponse.success(result);
  }

  @Get('stats/host')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get hosted rooms aggregate stats' })
  async getHostStats(
    @CurrentUser('_id') userId: string,
    @CurrentOrg() orgId: string,
  ): Promise<ApiResponse<HostRoomsStatsResponse>> {
    const stats = await this.roomService.getHostRoomsStats(userId, orgId);
    return ApiResponse.success(stats);
  }

  @Get('history/host')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get hosted rooms history' })
  async getHostHistory(
    @CurrentUser('_id') userId: string,
    @CurrentOrg() orgId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<RoomResult[]>> {
    const result = await this.roomService.getHostRoomsHistory(userId, orgId, query);
    return ApiResponse.success(result.items, result.meta);
  }

  @Get('history/student')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get student live quiz history' })
  async getStudentHistory(
    @CurrentUser('_id') userId: string,
    @CurrentOrg() orgId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<RoomResult[]>> {
    const result = await this.roomService.getStudentLiveHistory(userId, orgId, query);
    return ApiResponse.success(result.items, result.meta);
  }

  @Get(':pin/check')
  @ApiOperation({ summary: 'Check live room status by PIN' })
  @ApiParam({ name: 'pin', example: '123456', description: '6-digit room PIN' })
  async checkPin(@Param('pin') pin: string): Promise<ApiResponse<RoomPublicStatusResponse>> {
    const status = await this.roomService.getRoomPublicStatus(pin);
    return ApiResponse.success(status);
  }

  @Post(':pin/close')
  @UseGuards(ClerkAuthGuard, OrgContextGuard)
  @ApiBearerAuth('clerk-auth')
  @Audit('room.close')
  @ApiOperation({ summary: 'Close and terminate an active live quiz room session' })
  @ApiParam({ name: 'pin', example: '123456', description: '6-digit room PIN to close' })
  async closeRoom(
    @Param('pin') pin: string,
    @CurrentUser('_id') userId: string,
    @CurrentOrg() orgId: string,
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    const result = await this.roomService.closeRoom(pin, userId, orgId);
    return ApiResponse.success(result);
  }
}
