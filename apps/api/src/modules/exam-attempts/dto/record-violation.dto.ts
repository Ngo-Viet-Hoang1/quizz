import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ViolationType } from '../enums/violation-type.enum';

export class RecordViolationDto {
  @ApiProperty({
    description: 'Type of violation detected during proctoring',
    enum: ViolationType,
    example: ViolationType.TAB_SWITCH,
  })
  @IsEnum(ViolationType)
  @IsNotEmpty()
  type!: ViolationType;
}
