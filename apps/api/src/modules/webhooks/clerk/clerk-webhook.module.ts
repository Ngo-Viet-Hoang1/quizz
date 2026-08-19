import { Module } from '@nestjs/common';
import { UsersModule } from '../../users/users.module';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';

@Module({
  imports: [
    UsersModule,
    // OrgsModule,
    // MembersModule,
  ],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
  exports: [ClerkWebhookService],
})
export class ClerkWebhookModule {}
