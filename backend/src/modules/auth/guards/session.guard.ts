import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const deviceId = request.headers['x-device-id'] || 'default-device';

    if (!user || !user.id || !user.tenantId) {
      return true; // Delegate to JwtAuthGuard if unauthenticated
    }

    const session = await this.sessionService.validateSession(user.tenantId, user.id, deviceId);
    if (!session) {
      // Session has been terminated or expired
      throw new UnauthorizedException({
        code: 'SESSION_TERMINATED',
        message: 'This session has been logged out or expired from Redis.',
      });
    }

    request.session = session;
    return true;
  }
}
