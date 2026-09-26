import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { runWithRequestContext } from '../../database/tenant-context';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantIdHeader = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantIdHeader || typeof tenantIdHeader !== 'string' || tenantIdHeader.trim() === '') {
      throw new BadRequestException('Mandatory X-Tenant-ID header is missing or invalid');
    }

    const tenantId = tenantIdHeader.trim();
    request.tenantId = tenantId;

    // Initialize Request Context for AsyncLocalStorage
    const clientIp = request.ip || request.connection?.remoteAddress || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const userId = request.user?.userId || 'SYSTEM';
    const userRole = request.user?.role || 'GUEST';

    // Bind into execution context
    runWithRequestContext(
      {
        tenantId,
        userId,
        userRole,
        ipAddress: clientIp,
        userAgent,
      },
      () => {}
    );

    return true;
  }
}
