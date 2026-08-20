import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UserDocument } from '../../modules/users/schemas/user.schema';

function getParamDecoratorFactory<T>(
  decorator: (...dataOrPipes: T[]) => ParameterDecorator,
): (data: unknown, ctx: ExecutionContext) => unknown {
  class TestClass {
    public testMethod(@decorator() _value: unknown): boolean {
      return Boolean(_value);
    }
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testMethod') as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >;
  const key = Object.keys(metadata)[0] as string;
  return metadata[key].factory;
}

describe('CurrentUser Decorator', () => {
  const factory = getParamDecoratorFactory(CurrentUser);

  const mockUser = {
    _id: '66bf4b3d1234567890abcdef',
    clerkUserId: 'user_123',
    fullName: 'Test User',
    email: 'test@example.com',
  } as unknown as UserDocument;

  const createMockContext = (): ExecutionContext => {
    const request = {
      auth: {
        orgId: 'org_123',
        clerkUserId: 'user_123',
        userId: '66bf4b3d1234567890abcdef',
        user: mockUser,
      },
      user: mockUser,
    } as unknown as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return entire user object when no key is specified', () => {
    const context = createMockContext();
    const result = factory(undefined, context);
    expect(result).toEqual(mockUser);
  });

  it('should return specific field when key is passed', () => {
    const context = createMockContext();
    const email = factory('email', context);
    expect(email).toBe('test@example.com');
  });
});
