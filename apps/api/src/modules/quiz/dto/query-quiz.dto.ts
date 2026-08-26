import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from '../enums';

export class QueryQuizDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'TypeScript',
    description: 'Case-insensitive search keyword matched against quiz title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'Computer Science',
    description: 'Filter quizzes by category taxonomy name',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: QuizDifficulty,
    example: QuizDifficulty.MEDIUM,
    description: 'Filter quizzes by difficulty level (easy, medium, hard)',
  })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({
    enum: QuizSourceType,
    example: QuizSourceType.MANUAL,
    description: 'Filter quizzes by origin creation method (manual, ai_prompt, ai_document)',
  })
  @IsOptional()
  @IsEnum(QuizSourceType)
  sourceType?: QuizSourceType;

  @ApiPropertyOptional({
    enum: QuizVisibility,
    example: QuizVisibility.PUBLIC,
    description: 'Filter quizzes by visibility setting (public, private, unlisted, org_only)',
  })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;

  @ApiPropertyOptional({
    enum: QuizStatus,
    example: QuizStatus.PUBLISHED,
    description: 'Filter quizzes by status (draft, published, archived)',
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({
    example: 'user_2xyz1234567890',
    description: 'Filter quizzes authored by a specific Clerk User ID',
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
