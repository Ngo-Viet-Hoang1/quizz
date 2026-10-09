import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';

export class QueryExamAttemptDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by Quiz ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  quizId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Quiz Assignment ObjectId',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  assignmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by exam attempt status',
    enum: ExamAttemptStatus,
    example: ExamAttemptStatus.SUBMITTED,
  })
  @IsOptional()
  @IsEnum(ExamAttemptStatus)
  status?: ExamAttemptStatus;
}
