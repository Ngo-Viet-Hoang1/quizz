import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OrgContextGuard } from './org-context.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

describe('OrgContextGuard', () => {
  let guard: OrgContextGuard;

  beforeEach(() => {
    guard = new OrgContextGuard();
  });

  const createMockContext = (orgId: string | null = null): ExecutionContext => {
    const request = {
      auth: {
        orgId,
        clerkUserId: 'user_123',
        userId: '66bf4b3d1234567890abcdef',
      },
    } as unknown as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw ForbiddenException when orgId is null', () => {
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Organization context required');
  });

  it('should return true when orgId is present', () => {
    const context = createMockContext('org_abc_123');
    expect(guard.canActivate(context)).toBe(true);
  });
});
