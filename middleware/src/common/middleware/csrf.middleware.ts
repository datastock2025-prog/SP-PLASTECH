import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfDoubleSubmitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfDoubleSubmitMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }

    // Bypass for login/refresh and webhook endpoints
    const publicMutating = ['/api/auth/login', '/api/auth/refresh', '/api/health'];
    if (publicMutating.some((p) => req.originalUrl.startsWith(p))) {
      return next();
    }

    const cookieToken = req.cookies?.['XSRF-TOKEN'] || req.cookies?.['csrftoken'];
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

    // In double-submit pattern, header token must match cookie token
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      this.logger.warn(`CSRF Mismatch: IP ${req.ip} tried mutating ${req.method} ${req.originalUrl}`);
      throw new ForbiddenException({
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Invalid or missing CSRF validation token.',
      });
    }

    next();
  }
}
