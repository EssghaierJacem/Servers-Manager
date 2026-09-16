import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { AppConfig } from '../../config/configuration';

/**
 * Minimal Redis-backed cooldown: "has this key been used in the last N
 * seconds". Reuses the same Redis instance BullMQ already depends on
 * rather than pulling in a dedicated rate-limiting package.
 */
@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redis: Redis;

  constructor(configService: ConfigService<AppConfig, true>) {
    const redisConfig = configService.get('redis', { infer: true });
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Attempts to acquire a cooldown for `key`. Returns true if the caller
   * may proceed (and the cooldown is now armed), false if `key` is still
   * within its cooldown window from a previous acquisition.
   */
  async tryAcquire(key: string, windowSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'EX', windowSeconds, 'NX');
    return result === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger.warn(`Failed to close Redis connection cleanly: ${(error as Error).message}`);
    }
  }
}
