import { RawBodyRequest, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { ClerkWebhookEvent } from './clerk-webhook.types';

describe('ClerkWebhookController', () => {
  let controller: ClerkWebhookController;
  let webhookService: ClerkWebhookService;

  beforeEach(() => {
    webhookService = {
      verifyAndParse: jest.fn(),
      dispatch: jest.fn(),
    } as unknown as ClerkWebhookService;

    controller = new ClerkWebhookController(webhookService);
  });

  const mockRawBody = Buffer.from(JSON.stringify({ type: 'user.created', data: {} }));
  const mockHeaders = {
    'svix-id': 'msg_123',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1,sig123',
  };

  it('should throw UnauthorizedException when rawBody is missing', async () => {
    const mockReq = {} as RawBodyRequest<Request>;

    await expect(controller.handleClerkWebhook(mockReq, mockHeaders)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should verify and dispatch event when valid', async () => {
    const mockReq = { rawBody: mockRawBody } as unknown as RawBodyRequest<Request>;
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

    (webhookService.verifyAndParse as jest.Mock).mockReturnValueOnce(mockEvent);
    (webhookService.dispatch as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await controller.handleClerkWebhook(mockReq, mockHeaders);

    expect(result).toEqual({ success: true });
    expect(webhookService.verifyAndParse).toHaveBeenCalledWith(mockRawBody, mockHeaders);
    expect(webhookService.dispatch).toHaveBeenCalledWith(mockEvent);
  });
});
