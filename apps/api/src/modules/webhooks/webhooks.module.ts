import { Module } from '@nestjs/common';
import { ClerkWebhookModule } from './clerk/clerk-webhook.module';
import { SepayWebhookModule } from './sepay/sepay-webhook.module';

@Module({
  imports: [ClerkWebhookModule, SepayWebhookModule],
  exports: [ClerkWebhookModule, SepayWebhookModule],
})
export class WebhooksModule {}
