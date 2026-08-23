import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SubmitAttemptDto {
  @ApiProperty({ example: '6650a1b2c3d4e5f6a7b8c9d0', description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({
    example: ['6650a1b2c3d4e5f6a7b8c9d1'],
    description: 'Selected option IDs (for choice-based questions)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({
    example: 'TypeScript',
    description: 'Text answer (for fill_blank questions)',
  })
  @IsOptional()
  @IsString()
  answerText?: string;

  @ApiProperty({ example: 5200, description: 'Time taken to answer in milliseconds' })
  @IsInt()
  @Min(0)
  timeTakenMs!: number;
}
