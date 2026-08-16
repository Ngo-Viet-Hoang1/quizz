import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApiResponse as IApiResponse,
  PaginationMeta as IPaginationMeta,
  ErrorCodeType,
} from '@repo/shared-types';
import { getTraceId } from '../context/request-context';
import { FieldValidationError } from './field-validation-error';

export class PaginationMeta implements IPaginationMeta {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 100 }) total!: number;
  @ApiProperty({ example: 5 }) totalPages!: number;
}

export class ApiResponse<T = unknown> implements IApiResponse<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'SUCCESS' })
  code!: string;

  @ApiProperty({ example: 'Success' })
  message!: string;

  @ApiPropertyOptional({ description: 'Payload' })
  data!: T | null;

  @ApiProperty({ type: [FieldValidationError], default: [] })
  errors!: FieldValidationError[];

  @ApiPropertyOptional({ type: PaginationMeta })
  meta?: PaginationMeta;

  @ApiProperty({ example: '2026-08-16T12:00:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  traceId?: string;

  static success<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
    const res = new ApiResponse<T>();
    res.success = true;
    res.code = 'SUCCESS';
    res.message = 'Success';
    res.data = data;
    res.errors = [];
    res.meta = meta;
    res.timestamp = new Date().toISOString();
    res.traceId = getTraceId();
    return res;
  }

  static error(
    code: string,
    message: string,
    errors: FieldValidationError[] = [],
  ): ApiResponse<null> {
    const res = new ApiResponse<null>();
    res.success = false;
    res.code = code;
    res.message = message;
    res.data = null;
    res.errors = errors;
    res.timestamp = new Date().toISOString();
    res.traceId = getTraceId();
    return res;
  }

  static fromErrorCode(
    errorCode: ErrorCodeType,
    message: string,
    errors: FieldValidationError[] = [],
  ): ApiResponse<null> {
    return ApiResponse.error(errorCode, message, errors);
  }
}
