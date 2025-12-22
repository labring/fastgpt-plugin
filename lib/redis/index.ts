import { addLog } from '@/utils/log';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
// Base Redis options for connection reliability
const REDIS_BASE_OPTION = {
  // Retry strategy: exponential backoff with unlimited retries for stability
  retryStrategy: (times: number) => {
    // Never give up retrying to ensure worker keeps running
    const delay = Math.min(times * 50, 2000); // Max 2s between retries
    if (times > 10) {
      addLog.error(`[Redis connection failed] attempt ${times}, will keep retrying...`);
    } else {
      addLog.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    }
    return delay; // Always return a delay to keep retrying
  },
  // Reconnect on specific errors (Redis master-slave switch, network issues)
  reconnectOnError: (err: any) => {
    const reconnectErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
    const message = typeof err?.message === 'string' ? err.message : String(err ?? '');

    const shouldReconnect = reconnectErrors.some((errType) => message.includes(errType));
    if (shouldReconnect) {
      addLog.warn(`Redis reconnecting due to error: ${message}`);
    }
    return shouldReconnect;
  },
  // Connection timeout
  connectTimeout: 10000, // 10 seconds
  // Enable offline queue to buffer commands when disconnected
  enableOfflineQueue: true
};

export const FASTGPT_REDIS_PREFIX = 'fastgpt:';
export const getGlobalRedisConnection = () => {
  if (global.redisClient) return global.redisClient;

  global.redisClient = new Redis(REDIS_URL, {
    ...REDIS_BASE_OPTION,
    keyPrefix: FASTGPT_REDIS_PREFIX
  });

  global.redisClient.on('connect', () => {
    addLog.info('Redis connected');
  });
  global.redisClient.on('error', (error) => {
    addLog.error('Redis connection error', error);
  });

  return global.redisClient;
};

export const getAllKeysByPrefix = async (key: string) => {
  const redis = getGlobalRedisConnection();
  const keys = (await redis.keys(`${FASTGPT_REDIS_PREFIX}${key}:*`)).map((key) =>
    key.replace(FASTGPT_REDIS_PREFIX, '')
  );
  return keys;
};

declare global {
  var redisClient: Redis;
}
