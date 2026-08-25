import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../response/api-response';
import { FieldValidationError } from '../response/field-validation-error';
import { ErrorCode, HTTP_STATUS_TO_ERROR_CODE } from '../constants/error-code';

interface CustomValidationBody {
  code: string;
  message: string;
  errors: FieldValidationError[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (this.isCustomValidationBody(body)) {
        response.status(status).json(ApiResponse.error(body.code, body.message, body.errors));
        return;
      }

      const errorCode = HTTP_STATUS_TO_ERROR_CODE[status] ?? ErrorCode.BAD_REQUEST;
      const message = this.extractMessage(body, exception.message);

      this.logger.warn(`[HTTP ${status}] ${request.method} ${request.url} — ${message}`);
      response.status(status).json(ApiResponse.error(errorCode, message));
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const message = isProduction
      ? 'Internal server error'
      : exception instanceof Error
        ? exception.message
        : 'Unexpected error';

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(ErrorCode.INTERNAL_ERROR, message));
  }

  private isCustomValidationBody(body: unknown): body is CustomValidationBody {
    return typeof body === 'object' && body !== null && 'errors' in body;
  }

  private extractMessage(body: unknown, fallback: string): string {
    const raw =
      typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] })?.message ?? fallback);

    const formatted = Array.isArray(raw) ? raw.join(', ') : raw;
    return formatted.replace(/^ThrottlerException:\s*/i, '');
  }
}
