import { Module } from '@nestjs/common';
import { ClerkWebhookModule } from './clerk/clerk-webhook.module';

@Module({
  imports: [
    ClerkWebhookModule,
    // StripeWebhookModule,
  ],
  exports: [ClerkWebhookModule],
})
export class WebhooksModule {}
