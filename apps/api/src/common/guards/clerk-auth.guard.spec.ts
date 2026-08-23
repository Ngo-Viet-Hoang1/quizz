import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UsersService } from '../../modules/users/users.service';
import { ClerkClient } from '@clerk/backend';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn(),
}));

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let configService: ConfigService;
  let usersService: UsersService;
  let mockClerkClient: {
    users: {
      getUser: jest.Mock;
    };
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CLERK_SECRET_KEY') return 'sk_test_mock_secret';
        return null;
      }),
    } as unknown as ConfigService;

    usersService = {
      findById: jest.fn(),
      syncFromClerk: jest.fn(),
    } as unknown as UsersService;

    mockClerkClient = {
      users: {
        getUser: jest.fn(),
      },
    };

    guard = new ClerkAuthGuard(
      mockClerkClient as unknown as ClerkClient,
      configService,
      usersService,
    );
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: authHeader ? { authorization: authHeader } : {},
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw UnauthorizedException when Authorization header is missing', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Authorization header does not start with Bearer', async () => {
    const context = createMockContext('Basic 123456');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when verifyToken fails', async () => {
    (clerkBackend.verifyToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid signature'));
    const context = createMockContext('Bearer invalid_token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when user status is blocked', async () => {
    const mockBlockedUser = {
      _id: 'user_clerk_123',
      fullName: 'Blocked User',
      email: 'blocked@example.com',
      status: 'blocked',
    };

    (clerkBackend.verifyToken as jest.Mock).mockResolvedValueOnce({ sub: 'user_clerk_123' });
    (usersService.findById as jest.Mock).mockResolvedValueOnce(mockBlockedUser);

    const context = createMockContext('Bearer valid_token');
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should fallback to clerkClient.users.getUser when user is not yet in database and sync', async () => {
    const mockClerkUser = {
      id: 'user_clerk_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ id: 'email_1', emailAddress: 'john@example.com' }],
      primaryEmailAddressId: 'email_1',
      imageUrl: 'https://avatar.com/john.png',
    };

    const syncedUser = {
      _id: 'user_clerk_123',
      fullName: 'John Doe',
      email: 'john@example.com',
      status: 'active',
    };

    (clerkBackend.verifyToken as jest.Mock).mockResolvedValueOnce({ sub: 'user_clerk_123' });
    (usersService.findById as jest.Mock).mockResolvedValueOnce(null);
    mockClerkClient.users.getUser.mockResolvedValueOnce(mockClerkUser);
    (usersService.syncFromClerk as jest.Mock).mockResolvedValueOnce(syncedUser);

    const context = createMockContext('Bearer valid_token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockClerkClient.users.getUser).toHaveBeenCalledWith('user_clerk_123');
    expect(usersService.syncFromClerk).toHaveBeenCalledWith({
      userId: 'user_clerk_123',
      email: 'john@example.com',
      fullName: 'John Doe',
      avatarUrl: 'https://avatar.com/john.png',
    });
  });

  it('should attach local user document and auth context (including orgId) to request and return true when valid', async () => {
    const mockUser = {
      _id: 'user_clerk_123',
      fullName: 'Test User',
      email: 'test@example.com',
      status: 'active',
    };

    (clerkBackend.verifyToken as jest.Mock).mockResolvedValueOnce({
      sub: 'user_clerk_123',
      org_id: 'org_test_456',
      org_role: 'org:admin',
      org_permissions: ['org:quiz:manage'],
    });
    (usersService.findById as jest.Mock).mockResolvedValueOnce(mockUser);

    const context = createMockContext('Bearer valid_token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(mockUser);
    expect(req.auth).toEqual({
      orgId: 'org_test_456',
      orgRole: 'org:admin',
      orgPermissions: ['org:quiz:manage'],
      userId: 'user_clerk_123',
      user: mockUser,
    });
  });
});
