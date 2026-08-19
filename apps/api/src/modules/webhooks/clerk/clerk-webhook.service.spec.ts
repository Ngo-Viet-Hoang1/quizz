import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { UsersService } from '../../users/users.service';
import { ClerkWebhookService } from './clerk-webhook.service';
import { ClerkWebhookEvent, SvixHeaders } from './clerk-webhook.types';

const mockVerify = jest.fn();

jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}));

describe('ClerkWebhookService', () => {
  let service: ClerkWebhookService;
  let configService: ConfigService;
  let usersService: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CLERK_WEBHOOK_SECRET') return 'whsec_test_secret';
        return null;
      }),
    } as unknown as ConfigService;

    usersService = {
      handleWebhookEvent: jest.fn(),
    } as unknown as UsersService;

    service = new ClerkWebhookService(configService, usersService);
  });

  const mockRawBody = Buffer.from(JSON.stringify({ type: 'user.created', data: {} }));
  const mockHeaders: SvixHeaders = {
    'svix-id': 'msg_123',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1,sig123',
  };

  it('should throw UnauthorizedException when CLERK_WEBHOOK_SECRET is missing', () => {
    (configService.get as jest.Mock).mockReturnValueOnce(null);
    const unconfiguredService = new ClerkWebhookService(configService, usersService);

    expect(() => unconfiguredService.verifyAndParse(mockRawBody, mockHeaders)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when svix headers are missing', () => {
    expect(() => service.verifyAndParse(mockRawBody, {})).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when svix verification fails', () => {
    mockVerify.mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    expect(() => service.verifyAndParse(mockRawBody, mockHeaders)).toThrow(UnauthorizedException);
  });

  it('should return parsed event when svix verification succeeds', () => {
    const mockEvent: ClerkWebhookEvent = {
      type: 'user.created',
      data: {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        image_url: null,
        primary_email_address_id: 'email_1',
        email_addresses: [{ id: 'email_1', email_address: 'john@example.com' }],
      },
    };

    mockVerify.mockReturnValueOnce(mockEvent);

    const result = service.verifyAndParse(mockRawBody, mockHeaders);
    expect(result).toEqual(mockEvent);
    expect(Webhook).toHaveBeenCalledWith('whsec_test_secret');
  });

  it('should dispatch user events to usersService', async () => {
    const mockEvent: ClerkWebhookEvent = {
      type: 'user.created',
      data: {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        image_url: null,
        primary_email_address_id: 'email_1',
        email_addresses: [],
      },
    };

    await service.dispatch(mockEvent);
    expect(usersService.handleWebhookEvent).toHaveBeenCalledWith(mockEvent);
  });
});
