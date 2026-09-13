import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ReportReason, ReportStatus } from '../enums';

export class QueryQuizReportDto extends PaginationQueryDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsEnum(ReportReason)
  @IsOptional()
  reason?: ReportReason;

  @IsMongoId()
  @IsOptional()
  quizId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
