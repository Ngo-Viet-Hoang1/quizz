import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'MongoDB ObjectId of the Quiz to launch in live mode',
  })
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Specific quiz version to launch. If omitted, defaults to the latest published version.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizVersion?: number;

  @ApiPropertyOptional({
    example: 30,
    description:
      'Custom time limit per question in seconds for this live session. Overrides the quiz default.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(600)
  timeLimitSec?: number;
}
