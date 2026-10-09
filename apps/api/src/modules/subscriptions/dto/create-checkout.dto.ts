import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionPlan } from '@repo/shared-types';

export class CreateCheckoutDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
    description: 'Target plan to upgrade (pro or enterprise)',
  })
  @IsNotEmpty()
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}
