import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: 'Classroom name', example: 'Lớp 10A1 - Hóa học' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Classroom description',
    example: 'Lớp học thực hành Hóa học',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
