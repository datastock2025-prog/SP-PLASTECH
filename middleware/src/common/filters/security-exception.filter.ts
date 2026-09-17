import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected security anomaly occurred. Stack trace suppressed.';
    let code = 'INTERNAL_SECURITY_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'object') {
        message = res.message || message;
        code = res.code || res.error || 'HTTP_EXCEPTION';
        details = res.details || res.missingPermissions || undefined;
      } else {
        message = res;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[${incidentId}] System Exception: ${exception.message}`, exception.stack);
    }

    // Obfuscate database/internal stack traces for 500s in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An internal system anomaly was intercepted to safeguard session state.';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      incidentId,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
