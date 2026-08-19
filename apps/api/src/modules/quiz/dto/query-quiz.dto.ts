import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from '../schemas/quiz.schema';

export class QueryQuizDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() organizationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ enum: QuizDifficulty })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;
  @ApiPropertyOptional({ enum: QuizSourceType })
  @IsOptional()
  @IsEnum(QuizSourceType)
  sourceType?: QuizSourceType;
  @ApiPropertyOptional({ enum: QuizVisibility })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;
  @ApiPropertyOptional({ enum: QuizStatus }) @IsOptional() @IsEnum(QuizStatus) status?: QuizStatus;
}
