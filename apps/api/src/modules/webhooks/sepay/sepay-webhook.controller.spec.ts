import { Test, TestingModule } from '@nestjs/testing';
import { SepayWebhookDto } from '../../subscriptions/dto/sepay-webhook.dto';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SepayAuthGuard } from './sepay-auth.guard';
import { SepayWebhookController } from './sepay-webhook.controller';

describe('SepayWebhookController', () => {
  let controller: SepayWebhookController;
  let service: Partial<SubscriptionsService>;

  beforeEach(async () => {
    service = {
      processSepayWebhook: jest.fn().mockResolvedValue({
        success: true,
        message: 'Subscription upgraded successfully',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SepayWebhookController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(SepayAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SepayWebhookController>(SepayWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process webhook payload and return success message', async () => {
    const dto: SepayWebhookDto = {
      id: 4829104,
      gateway: 'MBBank',
      transactionDate: '2026-08-31 16:18:29',
      accountNumber: '0000000001',
      transferAmount: 199000,
      content: 'QUIZ org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP pro',
    };

    const res = await controller.handleSepayWebhook(dto);

    expect(res).toEqual({
      success: true,
      message: 'Subscription upgraded successfully',
    });
    expect(service.processSepayWebhook).toHaveBeenCalledWith(dto);
  });
});
