import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY, REQUIRE_MFA_KEY } from '../decorators/auth.decorators';

@Injectable()
export class RolesPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isMfaStepUpRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true; // Handled by JwtAuthGuard

    // Super Admin has global bypass
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // 1. Check Step-Up MFA
    if (isMfaStepUpRequired && !user.isMfaElevated) {
      throw new ForbiddenException({
        code: 'MFA_STEP_UP_REQUIRED',
        message: 'This sensitive action requires step-up MFA authorization.',
      });
    }

    // 2. Check Roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException({
          code: 'ROLE_UNAUTHORIZED',
          message: `Your role (${user.role}) is not authorized for this resource.`,
          requiredRoles,
        });
      }
    }

    // 3. Check Permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPerms: string[] = user.permissions || [];
      const hasAllPerms = requiredPermissions.every((p) => userPerms.includes(p));
      if (!hasAllPerms) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message: 'You lack the required operational permissions.',
          missingPermissions: requiredPermissions.filter((p) => !userPerms.includes(p)),
        });
      }
    }

    return true;
  }
}
