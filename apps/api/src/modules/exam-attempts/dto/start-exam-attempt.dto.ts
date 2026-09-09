import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, ValidateIf } from 'class-validator';

export class StartExamAttemptDto {
  @ApiPropertyOptional({
    description: 'Quiz ID to practice (required if assignmentId is omitted)',
    example: '507f1f77bcf86cd799439011',
  })
  @ValidateIf((o) => !o.assignmentId || o.quizId)
  @IsMongoId()
  quizId?: string;

  @ApiPropertyOptional({
    description: 'Class quiz assignment ID (if taking an assigned exam)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  assignmentId?: string;
}
