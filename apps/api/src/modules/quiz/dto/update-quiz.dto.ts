import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QuizStatus } from '../enums';
import { CreateQuizDto } from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @ApiPropertyOptional({ enum: QuizStatus })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
