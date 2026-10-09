import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SepayWebhookDto {
  @ApiProperty({
    example: 4829104,
    description: 'Unique transaction ID from SePay',
  })
  @IsNotEmpty()
  id!: number | string;

  @ApiProperty({
    example: 'MBBank',
    description: 'Bank brand name',
  })
  @IsNotEmpty()
  @IsString()
  gateway!: string;

  @ApiProperty({
    example: '2026-08-31 15:30:00',
    description: 'Transaction timestamp from bank',
  })
  @IsNotEmpty()
  @IsString()
  transactionDate!: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Bank account number',
  })
  @IsNotEmpty()
  @IsString()
  accountNumber!: string;

  @ApiPropertyOptional({
    example: 'MB_FT123456',
    description: 'Bank transaction code if available',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 'QUIZ org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP pro',
    description: 'Bank transfer memo / description containing orgId and plan',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: 'in',
    description: 'Transfer type (in/out)',
  })
  @IsOptional()
  @IsString()
  transferType?: string;

  @ApiPropertyOptional({
    example: 199000,
    description: 'Received transfer amount in VND',
  })
  @IsOptional()
  @IsNumber()
  transferAmount?: number;

  @ApiPropertyOptional({
    example: 'QUIZ org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP pro',
    description: 'Bank transfer description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 199000,
    description: 'Received transfer amount in VND (alternative field name)',
  })
  @IsOptional()
  @IsNumber()
  amountIn?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Transferred out amount in VND',
  })
  @IsOptional()
  @IsNumber()
  amountOut?: number;

  @ApiPropertyOptional({
    example: 'ORDER_123',
    description: 'Order code if available',
  })
  @IsOptional()
  orderCode?: string | number;

  @ApiPropertyOptional({
    example: 199000,
    description: 'Account balance after transaction',
  })
  @IsOptional()
  @IsNumber()
  accumulated?: number;

  @ApiPropertyOptional({
    example: 'FT2408319999',
    description: 'Bank reference code',
  })
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Sub-account number if used',
  })
  @IsOptional()
  subAccount?: string | null;
}
