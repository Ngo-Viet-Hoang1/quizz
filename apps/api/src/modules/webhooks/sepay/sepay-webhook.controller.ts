import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SepayWebhookDto } from '../../subscriptions/dto/sepay-webhook.dto';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SepayAuthGuard } from './sepay-auth.guard';

@ApiTags('webhooks')
@Controller('webhooks/sepay')
@SkipThrottle()
export class SepayWebhookController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SepayAuthGuard)
  @ApiOperation({
    summary: 'Receive SePay payment gateway webhook notification (Idempotent & ACID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully or acknowledged idempotently',
  })
  async handleSepayWebhook(
    @Body() dto: SepayWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.subscriptionsService.processSepayWebhook(dto);
  }
}
