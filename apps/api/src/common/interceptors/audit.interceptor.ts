import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getTraceId } from '../context/request-context';
import { AUDIT_ACTION_KEY } from '../decorators/audit.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());

    // Skip endpoints without @Audit() decorator
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseData: unknown) => {
          const durationMs = Date.now() - startTime;
          const method = request.method ?? null;
          const path = request.originalUrl ?? request.url ?? null;

          // Extract resourceId from route param (e.g. :id) or from response body on create
          const paramId = request.params?.id;
          const bodyId =
            typeof responseData === 'object' && responseData !== null
              ? ((responseData as Record<string, unknown>)._id?.toString() ??
                (responseData as Record<string, unknown>).id?.toString())
              : undefined;

          const resourceId = (paramId ?? bodyId ?? null) as string | null;
          const ip =
            (request.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
            request.ip ??
            null;
          const userAgent = request.headers?.['user-agent'] ?? null;
          const traceId = getTraceId() ?? null;
          const statusCode = response?.statusCode ?? 200;

          // Non-blocking background write — tap.next only runs on SUCCESS
          this.auditService
            .log({
              action,
              resourceId,
              userId: request.auth?.userId ?? null,
              orgId: request.auth?.orgId ?? null,
              method,
              path,
              durationMs,
              ip,
              userAgent,
              traceId,
              statusCode,
            })
            .catch((err: unknown) => {
              this.logger.warn(`Audit logging background error for action: ${action}`, err);
            });
        },
      }),
    );
  }
}
