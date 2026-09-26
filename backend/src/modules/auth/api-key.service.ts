import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface GeneratedApiKey {
  rawKey: string;
  hashedKey: string;
  prefix: string;
  tenantId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  /**
   * Generate a scoped API key formatted as: sp_live_<prefix>_<secret>
   */
  generateKey(tenantId: string, name: string, scopes: string[], expiresInDays?: number): GeneratedApiKey {
    const prefix = crypto.randomBytes(4).toString('hex');
    const secret = crypto.randomBytes(24).toString('hex');
    const rawKey = `sp_live_${prefix}_${secret}`;
    const hashedKey = this.hashKey(rawKey);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    return {
      rawKey,
      hashedKey,
      prefix,
      tenantId,
      name,
      scopes,
      expiresAt,
    };
  }

  hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  validateScope(requiredScope: string, keyScopes: string[]): boolean {
    if (keyScopes.includes('*') || keyScopes.includes('admin:all')) {
      return true;
    }
    return keyScopes.includes(requiredScope);
  }
}
