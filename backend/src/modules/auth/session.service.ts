import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface UserSessionData {
  sessionId: string;
  userId: string;
  tenantId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly redis: Redis;
  private readonly sessionTtlSeconds: number = 86400 * 7; // 7 days

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connection inactive in development: ${err.message}. Using in-memory fallback.`);
    });
  }

  // Memory fallback if Redis is disconnected during local bootstrap
  private readonly inMemorySessions = new Map<string, string>();

  /**
   * Register or refresh a user session in Redis with TTL
   */
  async createSession(session: UserSessionData): Promise<void> {
    const key = `session:${session.tenantId}:${session.userId}:${session.deviceId}`;
    const serialized = JSON.stringify(session);

    try {
      if (this.redis.status === 'ready') {
        await this.redis.set(key, serialized, 'EX', this.sessionTtlSeconds);
        await this.redis.sadd(`user_devices:${session.tenantId}:${session.userId}`, session.deviceId);
      } else {
        this.inMemorySessions.set(key, serialized);
      }
    } catch (e) {
      this.inMemorySessions.set(key, serialized);
    }
  }

  /**
   * Validate session active status and update lastActiveAt
   */
  async validateSession(tenantId: string, userId: string, deviceId: string): Promise<UserSessionData | null> {
    const key = `session:${tenantId}:${userId}:${deviceId}`;
    let data: string | null = null;

    try {
      if (this.redis.status === 'ready') {
        data = await this.redis.get(key);
      } else {
        data = this.inMemorySessions.get(key) || null;
      }
    } catch {
      data = this.inMemorySessions.get(key) || null;
    }

    if (!data) return null;

    try {
      const session: UserSessionData = JSON.parse(data);
      session.lastActiveAt = new Date().toISOString();

      // Non-blocking update
      if (this.redis.status === 'ready') {
        this.redis.set(key, JSON.stringify(session), 'EX', this.sessionTtlSeconds).catch(() => {});
      } else {
        this.inMemorySessions.set(key, JSON.stringify(session));
      }

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate a single device session
   */
  async forceLogout(tenantId: string, userId: string, deviceId: string): Promise<void> {
    const key = `session:${tenantId}:${userId}:${deviceId}`;
    try {
      if (this.redis.status === 'ready') {
        await this.redis.del(key);
        await this.redis.srem(`user_devices:${tenantId}:${userId}`, deviceId);
      } else {
        this.inMemorySessions.delete(key);
      }
    } catch {
      this.inMemorySessions.delete(key);
    }
  }

  /**
   * Invalidate all sessions for a user across all devices
   */
  async logoutAllDevices(tenantId: string, userId: string): Promise<void> {
    try {
      if (this.redis.status === 'ready') {
        const devices = await this.redis.smembers(`user_devices:${tenantId}:${userId}`);
        const keys = devices.map((d) => `session:${tenantId}:${userId}:${d}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        await this.redis.del(`user_devices:${tenantId}:${userId}`);
      } else {
        for (const k of this.inMemorySessions.keys()) {
          if (k.startsWith(`session:${tenantId}:${userId}:`)) {
            this.inMemorySessions.delete(k);
          }
        }
      }
    } catch {
      // ignore
    }
  }
}
