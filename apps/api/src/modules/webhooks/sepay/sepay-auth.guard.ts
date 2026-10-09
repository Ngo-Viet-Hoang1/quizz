import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * Guard to authenticate incoming SePay webhooks using either:
 * 1. HMAC-SHA256 signature verification (Timing-safe comparison)
 * 2. API Key verification in Authorization or X-Api-Key header (Timing-safe comparison)
 *
 * In local development / testing without configured secrets, permits requests in non-strict mode with a warning.
 */
@Injectable()
export class SepayAuthGuard implements CanActivate {
  private readonly logger = new Logger(SepayAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const webhookSecret = this.configService.get<string>('SEPAY_WEBHOOK_SECRET');
    const configuredApiKey = this.configService.get<string>('SEPAY_API_KEY');

    const isSecretConfigured = Boolean(
      webhookSecret &&
      !webhookSecret.startsWith('whsecret_your_') &&
      webhookSecret !== 'your_webhook_secret',
    );
    const isApiKeyConfigured = Boolean(
      configuredApiKey &&
      configuredApiKey !== 'your_sepay_api_key' &&
      !configuredApiKey.startsWith('your_'),
    );

    // 1. In development / testing: allow if neither valid secret nor API key is configured
    if (!isSecretConfigured && !isApiKeyConfigured) {
      this.logger.warn(
        'Neither valid SEPAY_WEBHOOK_SECRET nor SEPAY_API_KEY is configured. Allowing request in non-strict mode.',
      );
      return true;
    }

    // 2. Validate HMAC-SHA256 Signature if SEPAY_WEBHOOK_SECRET is set
    if (isSecretConfigured && webhookSecret) {
      const signatureHeader =
        request.headers['x-sepay-signature'] ||
        request.headers['sepay-signature'] ||
        request.headers['x-signature'];

      if (typeof signatureHeader === 'string') {
        const rawPayload = (request as unknown as { rawBody?: Buffer }).rawBody
          ? (request as unknown as { rawBody: Buffer }).rawBody.toString('utf-8')
          : JSON.stringify(request.body);

        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawPayload)
          .digest('hex');

        const sigBuf = Buffer.from(signatureHeader, 'utf-8');
        const compBuf = Buffer.from(computedSignature, 'utf-8');

        if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
          return true;
        }
        this.logger.warn('SePay HMAC-SHA256 signature verification failed.');
      }
    }

    // 3. Validate API Key if SEPAY_API_KEY is set (using timingSafeEqual to prevent timing attacks)
    if (isApiKeyConfigured && configuredApiKey) {
      const authHeader = request.headers['authorization'];
      const customHeader = request.headers['x-api-key'] || request.headers['x-sepay-key'];

      let providedKey = '';
      if (typeof authHeader === 'string') {
        const match = authHeader.match(/^Apikey\s+(.+)$/i);
        if (match && match[1]) {
          providedKey = match[1].trim();
        } else if (authHeader.startsWith('Bearer ')) {
          providedKey = authHeader.slice(7).trim();
        } else {
          providedKey = authHeader.trim();
        }
      }

      if (!providedKey && typeof customHeader === 'string') {
        providedKey = customHeader.trim();
      }

      if (providedKey) {
        const keyBuf = Buffer.from(providedKey, 'utf-8');
        const confBuf = Buffer.from(configuredApiKey, 'utf-8');

        if (keyBuf.length === confBuf.length && crypto.timingSafeEqual(keyBuf, confBuf)) {
          return true;
        }
      }
    }

    this.logger.warn('Unauthorized SePay webhook request: invalid signature or API key.');
    throw new UnauthorizedException('Invalid or missing SePay webhook authentication credentials');
  }
}
