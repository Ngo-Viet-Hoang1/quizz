import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { QuestionType, QuizDifficulty } from '../../quiz/enums';
import { SupportedAiModel } from '../enums/supported-ai-model.enum';

export class EnqueueAiGenerationJobDto {
  @ApiProperty({ description: 'Unique idempotency key per organization' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({
    description: 'Topic or subject for quiz questions, e.g. "TypeScript Advanced"',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  topic!: string;

  @ApiProperty({
    description:
      'Number of questions to generate (1-20 per batch for optimal quality and token safety)',
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  questionCount!: number;

  @ApiPropertyOptional({
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
    description: 'Type of questions to generate',
  })
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @ApiPropertyOptional({
    enum: QuizDifficulty,
    default: QuizDifficulty.MEDIUM,
    description: 'Difficulty of questions to generate',
  })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({
    enum: SupportedAiModel,
    default: SupportedAiModel.CLAUDE_3_5_HAIKU,
    description: 'AI model to use for quiz generation',
  })
  @IsOptional()
  @IsEnum(SupportedAiModel)
  model?: SupportedAiModel;
}

