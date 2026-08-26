import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { CLERK_CLIENT } from '../../../common/clerk/clerk-client.provider';
import { ClerkSyncService } from './clerk-sync.service';

describe('ClerkSyncService', () => {
  let service: ClerkSyncService;
  let mockClerkClient: {
    users: { getUserList: jest.Mock };
    organizations: {
      getOrganizationList: jest.Mock;
      getOrganizationMembershipList: jest.Mock;
    };
  };
  let mockCollection: {
    updateOne: jest.Mock;
  };
  let mockConnection: {
    db: {
      collection: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockClerkClient = {
      users: {
        getUserList: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'user_1',
              firstName: 'Test',
              lastName: 'User',
              primaryEmailAddressId: 'email_1',
              emailAddresses: [{ id: 'email_1', emailAddress: 'test@example.com' }],
              imageUrl: 'https://img.clerk.com/test.png',
              banned: false,
              createdAt: 1710000000,
            },
          ],
        }),
      },
      organizations: {
        getOrganizationList: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'org_1',
              name: 'Test Org',
              slug: 'test-org',
              imageUrl: 'https://img.clerk.com/org.png',
              createdAt: 1710000000,
            },
          ],
        }),
        getOrganizationMembershipList: jest.fn().mockResolvedValue({
          data: [
            {
              publicUserData: { userId: 'user_1' },
              role: 'org:admin',
              createdAt: 1710000000,
            },
          ],
        }),
      },
    };

    mockCollection = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    mockConnection = {
      db: {
        collection: jest.fn().mockReturnValue(mockCollection),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkSyncService,
        {
          provide: CLERK_CLIENT,
          useValue: mockClerkClient,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<ClerkSyncService>(ClerkSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully synchronize users, orgs, and memberships', async () => {
    const result = await service.syncAll();

    expect(result.syncedUsers).toBe(1);
    expect(result.syncedOrgs).toBe(1);
    expect(result.syncedMembers).toBe(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    expect(mockConnection.db.collection).toHaveBeenCalledWith('users');
    expect(mockConnection.db.collection).toHaveBeenCalledWith('organizations');
    expect(mockConnection.db.collection).toHaveBeenCalledWith('organizationmembers');
    expect(mockCollection.updateOne).toHaveBeenCalled();
  });
});
