import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CurrentOrg } from './current-org.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

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

describe('CurrentOrg Decorator', () => {
  const factory = getParamDecoratorFactory(CurrentOrg);

  const createMockContext = (orgId: string | null = null): ExecutionContext => {
    const request = {
      auth: {
        orgId,
        userId: 'user_123',
      },
    } as unknown as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return orgId when present in req.auth', () => {
    const context = createMockContext('org_xyz_789');
    const result = factory(null, context);
    expect(result).toBe('org_xyz_789');
  });

  it('should throw ForbiddenException when orgId is null', () => {
    const context = createMockContext(null);
    expect(() => factory(null, context)).toThrow(ForbiddenException);
    expect(() => factory(null, context)).toThrow('No active organization context in token');
  });
});
