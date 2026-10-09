import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';

export class SubscriptionResponseDto {
  @ApiProperty({
    example: 'org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP',
    description: 'Organization ID',
  })
  organizationId!: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
    description: 'Current subscription plan',
  })
  plan!: SubscriptionPlan;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    description: 'Subscription status',
  })
  status!: SubscriptionStatus;

  @ApiProperty({
    example: 1000,
    description: 'Monthly AI generation quota',
  })
  aiQuotaMonthly!: number;

  @ApiProperty({
    example: 25,
    description: 'AI generation quota used this period',
  })
  aiQuotaUsed!: number;

  @ApiProperty({
    example: '2026-08-31T15:00:00.000Z',
    description: 'Current period start timestamp',
  })
  currentPeriodStart!: Date;

  @ApiPropertyOptional({
    example: '2026-09-30T15:00:00.000Z',
    description: 'Current period end / expiration timestamp (null for free plan)',
  })
  currentPeriodEnd!: Date | null;
}
