import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  QuestionDifficulty,
  QuestionType,
  QuizDifficulty,
  QuizSourceType,
  QuizVisibility,
} from '../enums';

export class QuestionOptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class QuestionMetadataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctText?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  correctOrder?: string[];
}

export class QuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiPropertyOptional({ enum: QuestionType, default: QuestionType.SINGLE_CHOICE })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ enum: QuestionDifficulty, default: QuestionDifficulty.MEDIUM })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({ type: [QuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({ type: QuestionMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionMetadataDto)
  metadata?: QuestionMetadataDto;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'TypeScript Advanced Concepts' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'A comprehensive quiz on advanced TS features.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Programming' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: QuizDifficulty, default: QuizDifficulty.MEDIUM })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({ enum: QuizSourceType, default: QuizSourceType.MANUAL })
  @IsOptional()
  @IsEnum(QuizSourceType)
  sourceType?: QuizSourceType;

  @ApiPropertyOptional({ enum: QuizVisibility, default: QuizVisibility.PRIVATE })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;

  @ApiPropertyOptional({ example: 1800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [QuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
