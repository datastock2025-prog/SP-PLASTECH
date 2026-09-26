import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSION_KEY = 'required_permissions';
export const RequirePermissions = (module: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { module, action });

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<{ module: string; action: string }>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermission) {
      return true; // No explicit permission requirement set
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing for RBAC evaluation');
    }

    // Admins bypass granular checks
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    const permissionKey = `${requiredPermission.module}:${requiredPermission.action}`;
    const userPermissions: string[] = user.permissions || [];

    const hasPermission = userPermissions.includes(permissionKey) || userPermissions.includes(`${requiredPermission.module}:ALL`);

    if (!hasPermission) {
      throw new ForbiddenException(
        `User lacks required permission: ${permissionKey} on resource.`
      );
    }

    return true;
  }
}
