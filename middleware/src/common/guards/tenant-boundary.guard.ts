import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class TenantBoundaryGuard implements CanActivate {
  private readonly logger = new Logger(TenantBoundaryGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestedTenantId = request.headers['x-tenant-id'];

    if (!user) return true; // Handled by JwtAuthGuard

    // Super Admin has enterprise-wide multi-tenant access
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // If client specified a target tenant, enforce match against authorized tenant
    if (requestedTenantId && user.tenantId !== requestedTenantId) {
      this.logger.warn(
        `Cross-Tenant IDOR Attempt: User ${user.id} (${user.tenantId}) tried accessing tenant ${requestedTenantId}`
      );
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Access to data outside your assigned enterprise tenant boundary is strictly prohibited.',
      });
    }

    return true;
  }
}
