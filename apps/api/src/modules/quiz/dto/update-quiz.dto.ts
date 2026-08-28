import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QuizStatus } from '../enums';
import { CreateQuizDto } from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @ApiPropertyOptional({
    enum: QuizStatus,
    example: QuizStatus.PUBLISHED,
    description: 'Publishing lifecycle status of the quiz (draft, published, archived)',
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
