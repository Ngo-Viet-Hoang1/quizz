import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit.decorator';
import * as requestContext from '../context/request-context';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: Reflector;
  let auditService: {
    log: jest.Mock;
  };

  beforeEach(() => {
    reflector = new Reflector();
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    interceptor = new AuditInterceptor(reflector, auditService as unknown as AuditService);
  });

  const createMockContext = (
    action: string | undefined,
    requestOverrides: Record<string, unknown> = {},
  ): ExecutionContext => {
    const handler = () => {};
    if (action) {
      Reflect.defineMetadata(AUDIT_ACTION_KEY, action, handler);
    }

    const request = {
      method: 'DELETE',
      originalUrl: '/quizzes/resource_123',
      params: { id: 'resource_123' },
      headers: {
        'user-agent': 'JestTestRunner',
        'x-forwarded-for': '192.168.1.1',
      },
      ip: '127.0.0.1',
      auth: {
        userId: 'user_test_123',
        orgId: 'org_test_456',
      },
      ...requestOverrides,
    };

    const response = {
      statusCode: 200,
    };

    return {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  };

  it('should ignore endpoints without @Audit decorator', (done) => {
    const context = createMockContext(undefined);
    const next = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should trigger auditService.log on successful response with durationMs, method, path', (done) => {
    jest.spyOn(requestContext, 'getTraceId').mockReturnValue('trace_xyz');
    const context = createMockContext('quiz.delete');
    const next = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.log).toHaveBeenCalledWith({
          action: 'quiz.delete',
          resourceId: 'resource_123',
          userId: 'user_test_123',
          orgId: 'org_test_456',
          method: 'DELETE',
          path: '/quizzes/resource_123',
          durationMs: expect.any(Number),
          ip: '192.168.1.1',
          userAgent: 'JestTestRunner',
          traceId: 'trace_xyz',
          statusCode: 200,
        });
        done();
      },
    });
  });

  it('should extract resourceId from response body if route param id is not present', (done) => {
    const context = createMockContext('quiz.create', {
      method: 'POST',
      originalUrl: '/quizzes',
      params: {},
    });
    const next = {
      handle: () => of({ _id: 'created_quiz_999' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'quiz.create',
            resourceId: 'created_quiz_999',
            method: 'POST',
            path: '/quizzes',
          }),
        );
        done();
      },
    });
  });

  it('should NOT trigger auditService.log when the request throws an error', (done) => {
    const context = createMockContext('quiz.delete');
    const next = {
      handle: () => throwError(() => new Error('Quiz not found')),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
