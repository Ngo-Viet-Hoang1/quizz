import { Test, TestingModule } from '@nestjs/testing';
import { ClerkSyncController } from './clerk-sync.controller';
import { ClerkSyncService } from './clerk-sync.service';
import { CLERK_CLIENT } from '../../../common/clerk/clerk-client.provider';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

describe('ClerkSyncController', () => {
  let controller: ClerkSyncController;
  let mockClerkSyncService: {
    syncAll: jest.Mock;
  };

  beforeEach(async () => {
    mockClerkSyncService = {
      syncAll: jest.fn().mockResolvedValue({
        syncedUsers: 5,
        syncedOrgs: 2,
        syncedMembers: 7,
        durationMs: 150,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClerkSyncController],
      providers: [
        {
          provide: ClerkSyncService,
          useValue: mockClerkSyncService,
        },
        {
          provide: CLERK_CLIENT,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClerkSyncController>(ClerkSyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call clerkSyncService.syncAll and return results', async () => {
    const result = await controller.syncClerk();

    expect(result).toEqual({
      syncedUsers: 5,
      syncedOrgs: 2,
      syncedMembers: 7,
      durationMs: 150,
    });
    expect(mockClerkSyncService.syncAll).toHaveBeenCalledTimes(1);
  });
});
