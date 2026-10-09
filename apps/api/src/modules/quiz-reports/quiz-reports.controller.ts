import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { PaginateResult } from '../../common/utils/paginate.util';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QueryQuizReportDto } from './dto/query-quiz-report.dto';
import { ResolveQuizReportDto } from './dto/resolve-quiz-report.dto';
import { QuizReportDetailResponse, QuizReportsService } from './quiz-reports.service';
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

  @Get()
  @ApiOperation({ summary: 'Get all quiz reports with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of quiz reports' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryQuizReportDto,
  ): Promise<PaginateResult<QuizReport>> {
    return this.quizReportsService.findAllReports(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz report detail with question snapshot' })
  @ApiResponse({ status: 200, description: 'Quiz report detail response' })
  async getReportById(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<QuizReportDetailResponse> {
    return this.quizReportsService.getReportById(orgId, id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve or reject a quiz report with 1-click void action' })
  @ApiResponse({ status: 200, description: 'Quiz report resolved successfully' })
  async resolveReport(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') resolverId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ResolveQuizReportDto,
  ): Promise<QuizReport> {
    return this.quizReportsService.resolveReport(orgId, resolverId, id, dto);
  }
}
