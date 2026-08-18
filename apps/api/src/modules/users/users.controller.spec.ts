import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CLERK_CLIENT } from '../../common/clerk/clerk-client.provider';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from './schemas/user.schema';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findByClerkUserId: jest.fn(),
            syncFromClerk: jest.fn(),
          },
        },
        {
          provide: CLERK_CLIENT,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        ClerkAuthGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the current user in getMe', () => {
    const mockUser = {
      _id: 'mock_id',
      clerkUserId: 'user_123',
      fullName: 'Test User',
      email: 'test@example.com',
      status: 'active',
    } as unknown as UserDocument;

    expect(controller.getMe(mockUser)).toEqual(mockUser);
  });
});
