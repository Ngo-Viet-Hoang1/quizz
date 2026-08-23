import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { LeaderboardEntry, RoomService } from './room.service';
import { Room } from './schemas/room.schema';
import { RoomAttempt } from './schemas/room-attempt.schema';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth('clerk-auth')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audit('room.create')
  @ApiOperation({ summary: 'Create a new quiz room' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateRoomDto,
  ): Promise<Room> {
    return this.roomService.create(orgId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  findOne(@CurrentOrg() orgId: string, @Param('id', ParseObjectIdPipe) id: string): Promise<Room> {
    return this.roomService.findOne(id, orgId);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @Audit('room.join')
  @ApiOperation({ summary: 'Join a room as participant' })
  join(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: JoinRoomDto,
  ): Promise<Room> {
    return this.roomService.join(id, orgId, userId, dto);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @Audit('room.leave')
  @ApiOperation({ summary: 'Leave a room' })
  leave(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ left: boolean }> {
    return this.roomService.leave(id, orgId, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @Audit('room.start')
  @ApiOperation({ summary: 'Start the quiz session (host only)' })
  start(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<Room> {
    return this.roomService.start(id, orgId, userId);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @Audit('room.end')
  @ApiOperation({ summary: 'End the quiz session (host only)' })
  end(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<Room> {
    return this.roomService.end(id, orgId, userId);
  }

  @Post(':id/attempt')
  @HttpCode(HttpStatus.CREATED)
  @Audit('room.attempt')
  @ApiOperation({ summary: 'Submit an answer for a question' })
  submitAttempt(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: SubmitAttemptDto,
  ): Promise<RoomAttempt> {
    return this.roomService.submitAttempt(id, orgId, userId, dto);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get room leaderboard' })
  getLeaderboard(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<LeaderboardEntry[]> {
    return this.roomService.getLeaderboard(id, orgId);
  }
}
