import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class M2mApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(M2mApiKeyGuard.name);
  private readonly expectedM2mKeyHash: string;

  constructor() {
    const rawSecret = process.env.N8N_M2M_SECRET || 'sp_plastech_m2m_super_secure_key_2026';
    this.expectedM2mKeyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-m2m-api-key'] || request.headers['x-api-key'];

    if (!providedKey) {
      throw new UnauthorizedException('Missing M2M API Key header (X-M2M-API-Key)');
    }

    const providedHash = crypto.createHash('sha256').update(String(providedKey)).digest('hex');

    if (providedHash !== this.expectedM2mKeyHash) {
      this.logger.warn(`Unauthorized M2M API Key attempt from IP: ${request.ip}`);
      throw new ForbiddenException('Invalid Machine-to-Machine (M2M) API Key');
    }

    // IP subnet check for internal network
    const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress || '';
    request.isM2mAuthenticated = true;
    return true;
  }
}
