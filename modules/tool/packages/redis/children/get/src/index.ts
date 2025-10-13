import { z } from 'zod';
import { createRedisClient, handleRedisError } from '../../../client';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  redisUrl: z.string().url('Invalid Redis URL format'),
  key: z.string().min(1, 'Key cannot be empty')
});

// 输出类型
export const OutputType = z.object({
  value: z.string().nullable(),
  exists: z.boolean()
});

export async function tool({
  redisUrl,
  key
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    client = await createRedisClient(redisUrl);
    const value = await client.get(key);

    return {
      value,
      exists: value !== null
    };
  } catch (error) {
    return Promise.reject(handleRedisError(error));
  } finally {
    if (client) {
      await client.quit();
    }
  }
}
