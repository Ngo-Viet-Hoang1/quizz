import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../enums';

export class ResolveQuizReportDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status!: ReportStatus;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
