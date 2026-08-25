import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '6650a1b2c3d4e5f6a7b8c9d0', description: 'ID of the published quiz' })
  @IsString()
  @IsNotEmpty()
  quizId!: string;
}
