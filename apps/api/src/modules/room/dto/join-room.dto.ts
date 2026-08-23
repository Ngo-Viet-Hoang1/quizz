import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({ example: 'PlayerOne', description: 'Display name in the room' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nickname!: string;
}
