import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClassStatus } from '../enums/class.enum';

export class QueryClassDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClassStatus, description: 'Filter by class status' })
  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;

  @ApiPropertyOptional({ description: 'Filter by owner (teacher) user ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Search by class name' })
  @IsOptional()
  @IsString()
  search?: string;
}
