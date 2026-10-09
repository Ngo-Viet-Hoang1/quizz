import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Question ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({
    description: 'Array of selected option ObjectIds for choice questions',
    example: ['507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({
    description: 'Text answer for fill-in-blank questions',
    example: 'Photosynthesis',
  })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({
    description: 'Ordered array of option ObjectIds for ordering questions',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  orderAnswer?: string[];

  @ApiPropertyOptional({
    description: 'Time spent answering this question in seconds',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSec?: number;
}
