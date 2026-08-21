import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit:action';

/**
 * Decorator to mark a controller action for automatic audit logging on success.
 * @example @Audit('quiz.delete')
 */
export const Audit = (action: string): CustomDecorator<string> =>
  SetMetadata(AUDIT_ACTION_KEY, action);
