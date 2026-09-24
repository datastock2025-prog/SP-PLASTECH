import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class AuditHashInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditHashInterceptor.name);
  private lastBlockHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (!isMutating) {
      return next.handle();
    }

    const startTime = Date.now();
    const clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const actorId = (req as any).user?.id || req.headers['x-user-id'] || 'ANONYMOUS';

    return next.handle().pipe(
      tap((responseBody) => {
        try {
          const payloadString = JSON.stringify(req.body || {});
          const responseString = JSON.stringify(responseBody || {});
          const timestamp = new Date().toISOString();

          // Construct Merkle block hash: SHA-256(prevHash + method + url + actorId + payload + response + timestamp)
          const blockData = `${this.lastBlockHash}|${req.method}|${req.url}|${actorId}|${clientIp}|${payloadString}|${responseString}|${timestamp}`;
          const currentHash = crypto.createHash('sha256').update(blockData).digest('hex');

          this.lastBlockHash = currentHash;

          // Attach verification header to response
          res.setHeader('X-Audit-Block-Hash', currentHash);
          res.setHeader('X-Audit-Latency-Ms', (Date.now() - startTime).toString());
        } catch (err: any) {
          this.logger.warn(`Audit Hash generation notice: ${err.message}`);
        }
      })
    );
  }
}
