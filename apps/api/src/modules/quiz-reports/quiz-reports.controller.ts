import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QuizReportsService } from './quiz-reports.service';
import { QuizReport } from './schemas/quiz-report.schema';

@ApiTags('quiz-reports')
@Controller('quiz-reports')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class QuizReportsController {
  constructor(private readonly quizReportsService: QuizReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quiz question report' })
  @ApiResponse({ status: 201, description: 'Quiz report created successfully' })
  async createReport(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateQuizReportDto,
  ): Promise<QuizReport> {
    return this.quizReportsService.createReport(
      orgId,
      user._id,
      user.fullName || undefined,
      user.email || undefined,
      dto,
    );
  }
}
