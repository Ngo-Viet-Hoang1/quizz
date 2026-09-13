import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ReportReason } from '../enums';

export class CreateQuizReportDto {
  @IsMongoId()
  @IsNotEmpty()
  quizId!: string;

  @IsInt()
  @Min(1)
  quizVersion!: number;

  @IsMongoId()
  @IsNotEmpty()
  questionId!: string;

  @IsMongoId()
  @IsOptional()
  attemptId?: string;

  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason!: ReportReason;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
