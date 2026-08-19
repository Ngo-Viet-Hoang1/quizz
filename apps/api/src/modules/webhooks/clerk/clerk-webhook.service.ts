import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { UsersService } from '../../users/users.service';
import { ClerkWebhookEvent, SvixHeaders } from './clerk-webhook.types';

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.webhookSecret = configService.get<string>('CLERK_WEBHOOK_SECRET') ?? '';
  }

  verifyAndParse(rawBody: Buffer, headers: SvixHeaders): ClerkWebhookEvent {
    if (!this.webhookSecret) {
      throw new UnauthorizedException('CLERK_WEBHOOK_SECRET is not configured');
    }

    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Missing required Svix headers');
    }

    const wh = new Webhook(this.webhookSecret);
    try {
      return wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  async dispatch(event: ClerkWebhookEvent): Promise<void> {
    this.logger.debug(`Dispatching Clerk event: ${event.type}`);

    switch (event.type) {
      case 'user.created':
      case 'user.updated':
      case 'user.deleted':
        return this.usersService.handleWebhookEvent(event);

      // OrgsService.handleWebhookEvent(event)
      // MembersService.handleWebhookEvent(event)

      default:
        this.logger.debug(`Unhandled Clerk event: ${(event as { type: string }).type}`);
    }
  }
}
