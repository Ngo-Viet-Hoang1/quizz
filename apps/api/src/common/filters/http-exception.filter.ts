import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        message = Array.isArray(res.message) ? res.message.join(', ') : (res.message as string);
      } else {
        message = exception.message;
      }
      code = exception.name
        .replace('Exception', '')
        .replace(/(?<!^)(?=[A-Z])/g, '_')
        .toUpperCase(); // NotFoundException → NOT_FOUND
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message; // dev: cho xem message thật để debug
      }
    } else {
      this.logger.error(String(exception));
    }

    response.status(statusCode).json({
      success: false,
      error: { message, code, statusCode },
    });
  }
}
