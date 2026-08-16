import { ErrorCode, ErrorCodeType } from '@repo/shared-types';

export { ErrorCode, ErrorCodeType };

export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCodeType> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  422: ErrorCode.UNPROCESSABLE,
  429: ErrorCode.TOO_MANY_REQUESTS,
  500: ErrorCode.INTERNAL_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};
