export interface FieldValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
  errors: FieldValidationError[];
  meta?: PaginationMeta;
  timestamp: string;
  traceId?: string;
}

export const ErrorCode = {
  SUCCESS: 'SUCCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  UNPROCESSABLE: 'UNPROCESSABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly errors: FieldValidationError[] = [],
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  getFieldError(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }

  toFieldErrors(): Record<string, string> {
    return Object.fromEntries(this.errors.map((e) => [e.field, e.message]));
  }

  get isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }
}
