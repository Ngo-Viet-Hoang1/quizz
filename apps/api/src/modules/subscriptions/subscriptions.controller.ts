import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { CheckoutResponseDto, CreateCheckoutDto, SubscriptionResponseDto } from './dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription and AI generation quota status' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getCurrentSubscription(@CurrentOrg() orgId: string): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.getSubscriptionByOrgId(orgId);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @Audit('subscription.checkout_created')
  @ApiOperation({ summary: 'Generate VietQR checkout information to upgrade subscription' })
  createCheckout(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionsService.createCheckout(orgId, dto);
  }

  @Post('simulate-payment')
  @HttpCode(HttpStatus.OK)
  @Audit('subscription.simulate_payment')
  @ApiOperation({
    summary: 'Simulate successful VietQR payment for active organization (Dev Sandbox)',
  })
  simulatePayment(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.subscriptionsService.simulatePaymentForOrg(orgId, dto.plan);
  }

  @Post('reset-dev')
  @HttpCode(HttpStatus.OK)
  @Audit('subscription.reset_dev')
  @ApiOperation({
    summary: 'Reset active organization to Free Plan (Development / Demo sandbox helper)',
  })
  resetDevSubscription(@CurrentOrg() orgId: string): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.resetToFreeForDev(orgId);
  }
}
