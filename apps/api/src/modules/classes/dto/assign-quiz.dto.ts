import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

export class AssignQuizDto {
  @ApiProperty({ description: 'Quiz ID to assign to class', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @ApiPropertyOptional({
    description: 'Quiz version (defaults to active/current version)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quizVersion?: number;

  @ApiPropertyOptional({
    description: 'Due date in ISO format',
    example: '2026-09-10T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'Allow submitting after due date', default: false })
  @IsOptional()
  @IsBoolean()
  allowLateSubmit?: boolean;
}
