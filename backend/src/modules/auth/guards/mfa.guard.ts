import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // If user has MFA enabled, check if current session token has mfaVerified claim
    if (user.mfaEnabled && !user.mfaVerified) {
      throw new ForbiddenException({
        code: 'MFA_REQUIRED',
        message: 'MFA verification required to access this resource.',
        mfaRequired: true,
      });
    }

    return true;
  }
}
