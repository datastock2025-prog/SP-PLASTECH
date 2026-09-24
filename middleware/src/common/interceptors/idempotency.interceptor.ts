import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface CachedIdempotencyResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  cachedAt: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private cache = new Map<string, CachedIdempotencyResponse>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // Only inspect mutating operations (POST, PUT, PATCH, DELETE)
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (!isMutating) {
      return next.handle();
    }

    const idempotencyKey =
      (req.headers['x-idempotency-key'] as string) ||
      (req.headers['idempotency-key'] as string);

    if (!idempotencyKey) {
      return next.handle();
    }

    const tenantId = (req.headers['x-tenant-id'] as string) || 'DEFAULT';
    const compositeKey = `${tenantId}:${req.method}:${req.url}:${idempotencyKey}`;

    // Clean expired keys occasionally
    this.cleanExpired();

    if (this.cache.has(compositeKey)) {
      const cached = this.cache.get(compositeKey)!;
      this.logger.log(`Idempotency Hit: Serving cached response for key "${idempotencyKey}" on ${req.method} ${req.url}`);

      res.setHeader('X-Idempotency-Cache', 'HIT');
      res.setHeader('X-Idempotency-Key', idempotencyKey);
      res.status(cached.statusCode || 200);
      return of(cached.body);
    }

    return next.handle().pipe(
      tap((body) => {
        const statusCode = res.statusCode || 200;
        // Only cache successful mutations (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          this.cache.set(compositeKey, {
            statusCode,
            body,
            headers: { 'X-Idempotency-Cache': 'MISS' },
            cachedAt: Date.now(),
          });
          res.setHeader('X-Idempotency-Cache', 'MISS');
          res.setHeader('X-Idempotency-Key', idempotencyKey);
        }
      })
    );
  }

  private cleanExpired() {
    if (this.cache.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.cachedAt > this.TTL_MS) {
          this.cache.delete(k);
        }
      }
    }
  }
}
