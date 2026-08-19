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
  QuestionType,
  QuizDifficulty,
  QuizSourceType,
  QuizStatus,
  QuizVisibility,
} from '../schemas/quiz.schema';

export class QuestionOptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() _id?: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCorrect?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
}

export class QuestionMetadataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() correctText?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() correctOrder?: string[];
}

export class QuestionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() _id?: string;
  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() difficulty?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() points?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
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
  @ApiPropertyOptional() @IsOptional() @IsString() organizationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
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
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) timeLimitSec?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;
  @ApiPropertyOptional({ type: [QuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
