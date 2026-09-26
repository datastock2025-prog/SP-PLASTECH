import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions?: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret: string =
    process.env.JWT_SECRET || 'sp_plastech_super_jwt_secret_key_at_least_32_chars_long_2026';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication bearer token is required');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      request.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException(`Invalid or expired token: ${(err as Error).message}`);
    }
  }
}
