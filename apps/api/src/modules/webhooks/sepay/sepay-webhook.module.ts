import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';
import { SepayAuthGuard } from './sepay-auth.guard';
import { SepayWebhookController } from './sepay-webhook.controller';

@Module({
  imports: [SubscriptionsModule],
  controllers: [SepayWebhookController],
  providers: [SepayAuthGuard],
  exports: [SepayAuthGuard],
})
export class SepayWebhookModule {}
