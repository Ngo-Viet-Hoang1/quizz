import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../common/response/api-response';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizService } from './quiz.service';
import { Quiz } from './schemas/quiz.schema';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quiz' })
  create(@Body() dto: CreateQuizDto): Promise<Quiz> {
    return this.quizService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes' })
  async findAll(@Query() query: QueryQuizDto): Promise<ApiResponse<Quiz[]>> {
    const { items, meta } = await this.quizService.findAll(query);
    return ApiResponse.success(items, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  findOne(@Param('id') id: string): Promise<Quiz> {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update quiz' })
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto): Promise<Quiz> {
    return this.quizService.update(id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish quiz' })
  publish(@Param('id') id: string): Promise<Quiz> {
    return this.quizService.publish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive quiz' })
  archive(@Param('id') id: string): Promise<Quiz> {
    return this.quizService.archive(id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone quiz' })
  clone(@Param('id') id: string): Promise<Quiz> {
    return this.quizService.clone(id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share quiz' })
  share(@Param('id') id: string): Promise<{ shareCode: string; shareUrl: string }> {
    return this.quizService.share(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz (soft delete)' })
  remove(@Param('id') id: string): Promise<{ deleted: boolean; id: string }> {
    return this.quizService.remove(id);
  }
}
