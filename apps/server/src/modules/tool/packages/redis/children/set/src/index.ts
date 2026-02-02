import { z } from 'zod';
import { createRedisClient, handleRedisError } from '../../../client';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  redisUrl: z.string().url('Invalid Redis URL format'),
  key: z.string().min(1, 'Key cannot be empty'),
  value: z.string(),
  ttl: z.number().int().min(0).default(0)
});

// 输出类型
export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  redisUrl,
  key,
  value,
  ttl
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    client = await createRedisClient(redisUrl);

    if (ttl > 0) {
      // 带过期时间的 SET
      await client.setex(key, ttl, value);
    } else {
      // 永久 SET
      await client.set(key, value);
    }

    return { success: true };
  } catch (error) {
    return Promise.reject(handleRedisError(error));
  } finally {
    if (client) {
      await client.quit();
    }
  }
}
