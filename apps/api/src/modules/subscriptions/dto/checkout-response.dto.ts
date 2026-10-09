import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@repo/shared-types';

export class CheckoutResponseDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
    description: 'Target plan',
  })
  plan!: SubscriptionPlan;

  @ApiProperty({
    example: 199000,
    description: 'Amount in VND to transfer',
  })
  amount!: number;

  @ApiProperty({
    example: 'VND',
    description: 'Currency code',
  })
  currency!: string;

  @ApiProperty({
    example: 'QUIZ org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP pro',
    description: 'Exact transfer description / memo for bank transfer',
  })
  transferCode!: string;

  @ApiProperty({
    example: 'MBBank',
    description: 'Bank Name / Code',
  })
  bankId!: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Bank Account Number',
  })
  accountNumber!: string;

  @ApiProperty({
    example: 'NGUYEN VAN A',
    description: 'Bank Account Owner Name',
  })
  accountName!: string;

  @ApiProperty({
    example:
      'https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=199000&addInfo=QUIZ%20org_3I2Ys%20pro',
    description: 'VietQR dynamic QR image URL',
  })
  qrUrl!: string;
}
