import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import { ClerkSyncService, SyncClerkResult } from './clerk-sync.service';

@ApiTags('platform-sync')
@Controller('platform/sync/clerk')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth('clerk-auth')
export class ClerkSyncController {
  constructor(private readonly clerkSyncService: ClerkSyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger full synchronization of Users, Organizations, and Members from Clerk',
  })
  @ApiResponse({ status: 200, description: 'Clerk synchronization completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncClerk(): Promise<SyncClerkResult> {
    return this.clerkSyncService.syncAll();
  }
}
