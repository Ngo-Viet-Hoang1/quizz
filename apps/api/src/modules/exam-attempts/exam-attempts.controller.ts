import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ApiResponse } from '../../common/response/api-response';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { StartExamAttemptResponse } from './interfaces/exam-attempt.interface';
import { ExamAttemptStartService } from './services/exam-attempt-start.service';

@ApiTags('exam-attempts')
@Controller('exam-attempts')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class ExamAttemptsController {
  constructor(private readonly startService: ExamAttemptStartService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @Audit('exam_attempt.start')
  @ApiOperation({ summary: 'Start or resume an exam attempt for practice or class assignment' })
  async start(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: StartExamAttemptDto,
  ): Promise<ApiResponse<StartExamAttemptResponse>> {
    const result = await this.startService.startAttempt(orgId, userId, dto);
    return ApiResponse.success(result);
  }
}
