import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const CurrentOrg = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const orgId = req.auth?.orgId;
  if (!orgId) {
    throw new ForbiddenException('No active organization context in token');
  }
  return orgId;
});
