import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from '../enums';

export class QueryQuizDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term for quiz title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: QuizDifficulty, description: 'Filter by difficulty' })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({ enum: QuizSourceType, description: 'Filter by source type' })
  @IsOptional()
  @IsEnum(QuizSourceType)
  sourceType?: QuizSourceType;

  @ApiPropertyOptional({ enum: QuizVisibility, description: 'Filter by visibility' })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;

  @ApiPropertyOptional({ enum: QuizStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({ description: 'Filter by creator/owner Clerk user ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
