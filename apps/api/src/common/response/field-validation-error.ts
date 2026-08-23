import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldValidationError as IFieldValidationError } from '@repo/shared-types';

export class FieldValidationError implements IFieldValidationError {
  @ApiProperty({ example: 'email', description: 'Field that failed validation' })
  field!: string;

  @ApiProperty({ example: 'email must be a valid email address' })
  message!: string;

  @ApiPropertyOptional({ example: 'IS_EMAIL' })
  code?: string;
}
