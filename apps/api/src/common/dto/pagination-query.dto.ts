import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base pagination and sorting query DTO.
 * Search is intentionally omitted as it is domain-specific to each module.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    default: 1,
    example: 1,
    description: 'Page number (1-based index)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 10,
    example: 10,
    description: 'Number of items per page (maximum 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    default: 'createdAt',
    example: 'createdAt',
    description: 'Field name to sort results by',
  })
  @IsOptional()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
    description: 'Sort direction order',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
