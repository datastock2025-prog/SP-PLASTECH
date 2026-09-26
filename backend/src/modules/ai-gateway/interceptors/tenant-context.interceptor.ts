import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../../database/tenant-context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const tenantId =
      request.headers['x-tenant-id'] ||
      request.user?.tenantId ||
      'TENANT-ALPHA-IND';

    const userId = request.user?.id || 'openwebui-service-user';
    const correlationId = request.headers['x-correlation-id'] || `ai-req-${Date.now()}`;

    // Propagate context into AsyncLocalStorage
    return new Observable((subscriber) => {
      tenantStorage.run({ tenantId, userId, correlationId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
