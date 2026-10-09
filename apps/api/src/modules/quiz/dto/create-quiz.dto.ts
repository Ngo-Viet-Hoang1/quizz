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
  @ApiPropertyOptional({
    example: 'opt_123',
    description: 'Unique identifier for option',
  })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({
    example: 'A variable with block scope',
    description: 'Answer option text content',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    default: false,
    example: true,
    description: 'Indicates whether this option is a correct answer',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order index of option',
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class QuestionMetadataDto {
  @ApiPropertyOptional({
    example: 'Exact matching text answer',
    description: 'Target correct text for short answer or fill-in-the-blank questions',
  })
  @IsOptional()
  @IsString()
  correctText?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Step 1', 'Step 2', 'Step 3'],
    description: 'Correct sequence of items for ordering/sorting questions',
  })
  @IsOptional()
  @IsArray()
  correctOrder?: string[];
}

export class QuestionDto {
  @ApiPropertyOptional({
    example: 'q_123456',
    description: 'Unique identifier for question',
  })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
    example: QuestionType.SINGLE_CHOICE,
    description: 'Type of question format (single_choice, multiple_choice, true_false, etc.)',
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiProperty({
    example: 'What is the keyword used to declare a constant variable in JavaScript?',
    description: 'Question body/content text',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    example: 'const is used to declare block-scoped variables that cannot be reassigned.',
    description: 'Detailed explanation shown after answering or reviewing',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
    example: QuestionDifficulty.MEDIUM,
    description: 'Difficulty tier of the question',
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({
    default: 1,
    example: 10,
    description: 'Points awarded for answering this question correctly',
  })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sequence position of the question in the quiz',
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({
    type: [QuestionOptionDto],
    description: 'List of selectable answer options',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({
    type: QuestionMetadataDto,
    description: 'Additional metadata parameters for specialized question types',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionMetadataDto)
  metadata?: QuestionMetadataDto;
}

export class CreateQuizDto {
  @ApiProperty({
    example: 'TypeScript Advanced Concepts',
    description: 'Title of the quiz',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'A comprehensive assessment on generics, conditional types, and mapped types.',
    description: 'Detailed description of quiz scope and objectives',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Computer Science',
    description: 'Subject or category name',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: QuizDifficulty,
    default: QuizDifficulty.MEDIUM,
    example: QuizDifficulty.MEDIUM,
    description: 'Overall quiz difficulty level',
  })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({
    enum: QuizSourceType,
    default: QuizSourceType.MANUAL,
    example: QuizSourceType.MANUAL,
    description: 'Origin source of quiz creation (manual, ai_prompt, ai_document)',
  })
  @IsOptional()
  @IsEnum(QuizSourceType)
  sourceType?: QuizSourceType;

  @ApiPropertyOptional({
    enum: QuizVisibility,
    default: QuizVisibility.PRIVATE,
    example: QuizVisibility.PRIVATE,
    description: 'Access visibility scope (public, private, unlisted, org_only)',
  })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility;

  @ApiPropertyOptional({
    example: 1800,
    description: 'Countdown time limit in seconds (0 or omitted means unlimited)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitSec?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/quiz-covers/typescript.jpg',
    description: 'URL of the quiz cover image banner',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    type: [QuestionDto],
    description: 'List of questions included in this quiz',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
