import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClassMemberRole, ClassMemberStatus } from '../enums/class.enum';

export class QueryClassMemberDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClassMemberRole, description: 'Filter by member role' })
  @IsOptional()
  @IsEnum(ClassMemberRole)
  role?: ClassMemberRole;

  @ApiPropertyOptional({ enum: ClassMemberStatus, description: 'Filter by member status' })
  @IsOptional()
  @IsEnum(ClassMemberStatus)
  status?: ClassMemberStatus;
}
