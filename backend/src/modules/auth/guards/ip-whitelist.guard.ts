import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  // Tenant IP CIDR / List mapping cache
  private readonly tenantIpAllowlist = new Map<string, string[]>([
    ['TENANT-ALPHA-IND', ['127.0.0.1', '::1', '10.0.0.0/8', '192.168.0.0/16', '172.16.0.0/12']],
  ]);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;

    if (!tenantId) return true;

    const allowedIps = this.tenantIpAllowlist.get(tenantId);
    if (!allowedIps || allowedIps.length === 0) {
      return true; // No restriction configured for this tenant
    }

    const clientIp =
      request.headers['cf-connecting-ip'] ||
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.socket?.remoteAddress ||
      '127.0.0.1';

    const isAllowed = allowedIps.some((allowed) => {
      if (allowed === '*' || allowed === clientIp) return true;
      if (clientIp === '::1' && (allowed === '127.0.0.1' || allowed === '::1')) return true;
      return false;
    });

    if (!isAllowed) {
      throw new ForbiddenException({
        code: 'IP_NOT_WHITELISTED',
        message: `Client IP ${clientIp} is not authorized for tenant ${tenantId}`,
      });
    }

    return true;
  }
}
