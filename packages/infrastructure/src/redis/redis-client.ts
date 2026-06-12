import Redis from 'ioredis';

import { env } from '../env';
import { getLogger, infra } from '../logger';

// Base Redis options for connection reliability
const REDIS_BASE_OPTION = {
  // Retry strategy: exponential backoff with unlimited retries for stability
  retryStrategy: (times: number) => {
    const logger = getLogger(infra.redis);
    // Never give up retrying to ensure worker keeps running
    const delay = Math.min(times * 50, 2000); // Max 2s between retries
    if (times > 10) {
      logger.error(`[Redis connection failed] attempt ${times}, will keep retrying...`);
    } else {
      logger.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    }
    return delay; // Always return a delay to keep retrying
  },
  // Reconnect on specific errors (Redis master-slave switch, network issues)
  reconnectOnError: (error: unknown) => {
    const logger = getLogger(infra.redis);
    const reconnectErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
    const message =
      typeof (error as { message?: unknown })?.message === 'string'
        ? (error as { message: string }).message
        : String(error ?? '');

    const shouldReconnect = reconnectErrors.some((errType) => message.includes(errType));
    if (shouldReconnect) {
      logger.warn(`Redis reconnecting due to error: ${JSON.stringify(error, null, 2)}`, { error });
    }
    return shouldReconnect;
  },
  // Connection timeout
  connectTimeout: 10000, // 10 seconds
  // Enable offline queue to buffer commands when disconnected
  enableOfflineQueue: true
};

export const FASTGPT_REDIS_PREFIX = 'fastgpt-plugin:';

/** Redis 底层连接类，单例模式 */
export class RedisClient {
  private static instance: RedisClient | undefined;
  private client: Redis;
  private readonly logger = getLogger(infra.redis);

  private constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      ...REDIS_BASE_OPTION,
      keyPrefix: FASTGPT_REDIS_PREFIX
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected');
    });
    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${JSON.stringify(error, null, 2)}`, { error });
    });
  }

  get getClient(): Redis {
    return this.client;
  }

  static getInstance(): RedisClient {
    RedisClient.instance ??= new RedisClient(env.REDIS_URL);
    return RedisClient.instance;
  }

  static create({ redisUrl }: { redisUrl: string }): RedisClient {
    return new RedisClient(redisUrl);
  }

  async getAllKeysByPrefix(key: string): Promise<string[]> {
    const keys = (await this.client.keys(`${FASTGPT_REDIS_PREFIX}${key}:*`)).map((item) =>
      item.replace(FASTGPT_REDIS_PREFIX, '')
    );
    return keys;
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    const client = this.client;
    await client.quit();
  }
}
