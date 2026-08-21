import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from './schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: UserDocument): UserDocument {
    return user;
  }
}
