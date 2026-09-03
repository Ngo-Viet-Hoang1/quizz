import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryQuizAssignmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by quiz ID' })
  @IsOptional()
  @IsMongoId()
  quizId?: string;
}
