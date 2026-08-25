import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { ClerkWebhookService } from './clerk-webhook.service';
import { SvixHeaders } from './clerk-webhook.types';

@ApiTags('webhooks:clerk')
@SkipThrottle()
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(private readonly clerkWebhookService: ClerkWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Clerk Webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid Svix signature or missing headers' })
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ): Promise<{ success: boolean }> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Raw body is missing. Ensure rawBody: true in main.ts');
    }

    const svixHeaders: SvixHeaders = {
      'svix-id': headers['svix-id'],
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    };

    const event = this.clerkWebhookService.verifyAndParse(rawBody, svixHeaders);

    await this.clerkWebhookService.dispatch(event);

    return { success: true };
  }
}
