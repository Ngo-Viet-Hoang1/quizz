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
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { ApiResponse } from '../../common/response/api-response';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { IQuiz } from './interfaces/quiz.interface';
import { QuizService } from './quiz.service';
import { Quiz } from './schemas/quiz.schema';

@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Audit('quiz.create')
  @ApiOperation({ summary: 'Create a new quiz' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateQuizDto,
  ): Promise<Quiz> {
    return this.quizService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes for current organization' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryQuizDto,
  ): Promise<ApiResponse<IQuiz[]>> {
    const { items, meta } = await this.quizService.findAll(orgId, query);
    return ApiResponse.success(items, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  findOne(@CurrentOrg() orgId: string, @Param('id', ParseObjectIdPipe) id: string): Promise<Quiz> {
    return this.quizService.findOne(id, orgId);
  }

  @Patch(':id')
  @Audit('quiz.update')
  @ApiOperation({ summary: 'Update quiz' })
  update(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateQuizDto,
  ): Promise<Quiz> {
    return this.quizService.update(id, orgId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Audit('quiz.publish')
  @ApiOperation({ summary: 'Publish quiz' })
  publish(@CurrentOrg() orgId: string, @Param('id', ParseObjectIdPipe) id: string): Promise<Quiz> {
    return this.quizService.publish(id, orgId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @Audit('quiz.archive')
  @ApiOperation({ summary: 'Archive quiz' })
  archive(@CurrentOrg() orgId: string, @Param('id', ParseObjectIdPipe) id: string): Promise<Quiz> {
    return this.quizService.archive(id, orgId);
  }

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @Audit('quiz.clone')
  @ApiOperation({ summary: 'Clone quiz (creates a new copy)' })
  clone(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<Quiz> {
    return this.quizService.clone(id, orgId, userId);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @Audit('quiz.share')
  @ApiOperation({ summary: 'Share quiz (generates share code and URL)' })
  share(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ shareCode: string; shareUrl: string }> {
    return this.quizService.share(id, orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Audit('quiz.delete')
  @ApiOperation({ summary: 'Delete quiz (soft delete)' })
  remove(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.quizService.remove(id, orgId);
  }
}
