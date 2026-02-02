import Redis from 'ioredis';

/**
 * 创建 Redis 客户端连接
 */
export async function createRedisClient(redisUrl: string): Promise<Redis> {
  const client = new Redis(redisUrl, {
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // 停止重试
      }
      return Math.min(times * 200, 2000); // 重试间隔
    },
    connectTimeout: 10000, // 10 秒连接超时
    commandTimeout: 5000, // 5 秒命令超时
    lazyConnect: true
  });

  // 测试连接
  await client.connect();
  await client.ping();

  return client;
}

/**
 * 错误处理
 */
export function handleRedisError(error: unknown): string {
  let errorMessage = 'Unknown error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // 区分错误类型
  if (errorMessage.includes('ECONNREFUSED')) {
    return 'Redis connection refused. Please check Redis URL and ensure Redis is running.';
  } else if (errorMessage.includes('ETIMEDOUT')) {
    return 'Redis connection timeout. Please check network and Redis availability.';
  } else if (errorMessage.includes('NOAUTH')) {
    return 'Redis authentication failed. Please check connection string.';
  }

  return errorMessage;
}
