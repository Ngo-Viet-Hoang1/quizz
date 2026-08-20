import { Module } from '@nestjs/common';
import { UsersModule } from '../../users/users.module';
import { OrganizationsModule } from '../../organizations/organizations.module';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { OrganizationMembersModule } from '@/modules/organization-members/organization-members.module';

@Module({
  imports: [UsersModule, OrganizationsModule, OrganizationMembersModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
  exports: [ClerkWebhookService],
})
export class ClerkWebhookModule {}
