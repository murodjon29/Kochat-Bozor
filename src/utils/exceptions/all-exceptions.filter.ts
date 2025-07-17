import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const message = (exceptionResponse as any).message;
        errorMessage = Array.isArray(message)
          ? message.join(', ')
          : message || errorMessage;
        const validationErrors = (exceptionResponse as any).errors;
        if (validationErrors) errorMessage = validationErrors.join(', ');
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }
    response
      .status(status)
      .json({ status_code: status, error: { message: errorMessage } });
  }
}
