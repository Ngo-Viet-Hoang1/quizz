import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClassMemberRole } from '../enums/class.enum';

export class AddClassMemberDto {
  @ApiProperty({ description: 'User ID of the member to add', example: 'user_2xyz...' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ enum: ClassMemberRole, default: ClassMemberRole.STUDENT })
  @IsOptional()
  @IsEnum(ClassMemberRole)
  role?: ClassMemberRole;
}
