import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClassStatus } from '../enums/class.enum';

export class UpdateClassDto {
  @ApiPropertyOptional({ description: 'Classroom name', example: 'Lớp 10A1 - Hóa học nâng cao' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ClassStatus, description: 'Class status' })
  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
