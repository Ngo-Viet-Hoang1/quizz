import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryAuditLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'quiz.delete',
    description: 'Filter by exact action name',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    example: 'quiz',
    description: 'Filter by resource type (e.g. quiz, class, subscription)',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    example: 'user_2xyz...',
    description: 'Filter by actor user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 200,
    description: 'Filter by HTTP response status code',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Filter logs from this timestamp (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.999Z',
    description: 'Filter logs up to this timestamp (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
