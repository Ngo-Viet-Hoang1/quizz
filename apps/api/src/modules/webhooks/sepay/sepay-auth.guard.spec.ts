import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SepayAuthGuard } from './sepay-auth.guard';

describe('SepayAuthGuard', () => {
  let guard: SepayAuthGuard;
  let configService: Partial<ConfigService>;

  const mockExecutionContext = (
    headers: Record<string, string>,
    body: Record<string, unknown> = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow request if neither SEPAY_WEBHOOK_SECRET nor SEPAY_API_KEY is configured (dev mode)', () => {
    configService = {
      get: jest.fn().mockReturnValue(undefined),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request when Authorization Apikey header matches SEPAY_API_KEY (timing safe)', () => {
    configService = {
      get: jest.fn((key: string) => (key === 'SEPAY_API_KEY' ? 'valid_sepay_key_123' : undefined)),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext({
      authorization: 'Apikey valid_sepay_key_123',
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request when x-api-key header matches SEPAY_API_KEY', () => {
    configService = {
      get: jest.fn((key: string) => (key === 'SEPAY_API_KEY' ? 'valid_sepay_key_123' : undefined)),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext({
      'x-api-key': 'valid_sepay_key_123',
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request when HMAC-SHA256 signature matches SEPAY_WEBHOOK_SECRET', () => {
    const secret = 'whsecret_test_998877665544332211';
    const body = { id: 12345, transferAmount: 199000 };
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    configService = {
      get: jest.fn((key: string) => (key === 'SEPAY_WEBHOOK_SECRET' ? secret : undefined)),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext(
      {
        'x-sepay-signature': validSignature,
      },
      body,
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when HMAC-SHA256 signature is invalid', () => {
    const secret = 'whsecret_test_998877665544332211';
    const body = { id: 12345, transferAmount: 199000 };

    configService = {
      get: jest.fn((key: string) => (key === 'SEPAY_WEBHOOK_SECRET' ? secret : undefined)),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext(
      {
        'x-sepay-signature': 'invalid_hmac_signature_hex',
      },
      body,
    );
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when API key is wrong', () => {
    configService = {
      get: jest.fn((key: string) => (key === 'SEPAY_API_KEY' ? 'valid_sepay_key_123' : undefined)),
    };
    guard = new SepayAuthGuard(configService as ConfigService);

    const context = mockExecutionContext({
      'x-api-key': 'wrong_key_12345',
    });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
