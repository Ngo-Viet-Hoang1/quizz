import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ApiResponse } from '../../common/response/api-response';
import { RecordViolationDto } from './dto/record-violation.dto';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { IExamAttempt, StartExamAttemptResponse } from './interfaces/exam-attempt.interface';
import { ExamAttemptProgressService } from './services/exam-attempt-progress.service';
import { ExamAttemptStartService } from './services/exam-attempt-start.service';
import { ExamAttemptSubmitService } from './services/exam-attempt-submit.service';

@ApiTags('exam-attempts')
@Controller('exam-attempts')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class ExamAttemptsController {
  constructor(
    private readonly startService: ExamAttemptStartService,
    private readonly progressService: ExamAttemptProgressService,
    private readonly submitService: ExamAttemptSubmitService,
  ) {}

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

  @Put(':id/answer')
  @HttpCode(HttpStatus.OK)
  @Audit('exam_attempt.answer')
  @ApiOperation({ summary: 'Save or update student answer for a question during exam attempt' })
  async saveAnswer(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) attemptId: string,
    @Body() dto: SubmitAnswerDto,
  ): Promise<ApiResponse<IExamAttempt>> {
    const result = await this.progressService.saveAnswer(orgId, userId, attemptId, dto);
    return ApiResponse.success(result);
  }

  @Post(':id/violations')
  @HttpCode(HttpStatus.OK)
  @Audit('exam_attempt.violation')
  @ApiOperation({ summary: 'Record proctoring or integrity violation during exam attempt' })
  async recordViolation(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) attemptId: string,
    @Body() dto: RecordViolationDto,
  ): Promise<ApiResponse<IExamAttempt>> {
    const result = await this.progressService.recordViolation(orgId, userId, attemptId, dto);
    return ApiResponse.success(result);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Audit('exam_attempt.submit')
  @ApiOperation({ summary: 'Submit and finalize an exam attempt with auto-grading' })
  async submit(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) attemptId: string,
  ): Promise<ApiResponse<IExamAttempt>> {
    const result = await this.submitService.submitAttempt(orgId, userId, attemptId);
    return ApiResponse.success(result);
  }
}
