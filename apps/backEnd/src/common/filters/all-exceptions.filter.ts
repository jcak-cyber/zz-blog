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

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      let message =
        typeof exResponse === 'string'
          ? exResponse
          : ((exResponse as { message?: string | string[] }).message ?? exception.message);

      // 限流等默认英文信息改为简体中文
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        message = '尝试过于频繁，请稍后再试';
      } else if (typeof message === 'string' && /throttl|too many requests/i.test(message)) {
        message = '尝试过于频繁，请稍后再试';
      }

      response.status(status).json({
        statusCode: status,
        message,
        error: HttpStatus[status] ?? 'Error',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: '服务器内部错误',
      error: 'Internal Server Error',
    });
  }
}
