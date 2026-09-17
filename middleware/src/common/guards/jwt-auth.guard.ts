import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../../database/database.service';

export const JWT_SECRET = process.env.JWT_SECRET || 'reboot_erp_super_secure_jwt_secret_2026';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.query?.auth_token) {
      token = request.query.auth_token;
    }

    if (!token) {
      throw new UnauthorizedException({
        code: 'MISSING_AUTH_TOKEN',
        message: 'Authentication token required.',
      });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // Check if user session has been revoked in database
      if (decoded.sessionId) {
        const sessionCheck = await this.db.query(
          `SELECT is_revoked FROM auth_active_sessions WHERE session_id = $1`,
          [decoded.sessionId]
        );
        if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].is_revoked) {
          throw new UnauthorizedException({
            code: 'SESSION_REVOKED',
            message: 'Your session has been terminated remotely or expired.',
          });
        }
      }

      request.user = decoded;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Token verification failed.',
      });
    }
  }
}
