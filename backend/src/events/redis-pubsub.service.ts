import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private pubClient: Redis;
  private subClient: Redis;
  private readonly handlers = new Map<string, Set<(payload: any) => void>>();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.pubClient = new Redis(redisUrl, { lazyConnect: true });
    this.subClient = new Redis(redisUrl, { lazyConnect: true });
  }

  async onModuleInit() {
    try {
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      this.subClient.on('message', (channel: string, message: string) => {
        try {
          const parsed = JSON.parse(message);
          const channelHandlers = this.handlers.get(channel);
          if (channelHandlers) {
            channelHandlers.forEach((handler) => handler(parsed));
          }
        } catch (e) {
          this.logger.error(`Error processing message on channel ${channel}: ${e}`);
        }
      });

      this.logger.log('Redis Pub/Sub connected successfully');
    } catch (err: any) {
      this.logger.warn(`Redis PubSub in offline memory mode: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.pubClient.quit(), this.subClient.quit()]);
  }

  /**
   * Publish an event to a Redis channel
   */
  async publish(channel: string, payload: any): Promise<void> {
    try {
      if (this.pubClient.status === 'ready') {
        await this.pubClient.publish(channel, JSON.stringify(payload));
      } else {
        // In-memory immediate trigger for local dev
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
          channelHandlers.forEach((h) => h(payload));
        }
      }
    } catch {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.forEach((h) => h(payload));
      }
    }
  }

  /**
   * Subscribe to a Redis channel
   */
  async subscribe(channel: string, handler: (payload: any) => void): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      if (this.subClient.status === 'ready') {
        await this.subClient.subscribe(channel);
      }
    }
    this.handlers.get(channel)!.add(handler);
  }
}
