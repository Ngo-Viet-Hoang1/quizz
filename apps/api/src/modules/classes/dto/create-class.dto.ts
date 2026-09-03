import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: 'Classroom name', example: 'Lớp 10A1 - Hóa học' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
