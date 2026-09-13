import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse, PaginationMeta } from '../response/api-response';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data instanceof StreamableFile) return data;
        if (data instanceof ApiResponse) return data;
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          const paginated = data as { items: unknown; meta?: PaginationMeta };
          return ApiResponse.success(paginated.items, paginated.meta);
        }
        return ApiResponse.success(data);
      }),
    );
  }
}
