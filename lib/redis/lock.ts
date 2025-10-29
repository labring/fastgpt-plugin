import z from 'zod';
import { FASTGPT_REDIS_PREFIX, getGlobalRedisConnection } from '.';
export const lockEnum = z.enum(['parsePkg']);
const lockPrefix = `${FASTGPT_REDIS_PREFIX}LOCK:`;

export const acquireLock = async (key: z.infer<typeof lockEnum>, timeoutMs: number) => {
  const redis = getGlobalRedisConnection();
  const lockKey = `${lockPrefix}${key}`;

  // Try to set the lock with NX (only set if not exists) and PX (expiry)
  const result = await redis.set(lockKey, 'NX', 'PX', timeoutMs);

  // If result is 'OK', we acquired the lock
  if (result === 'OK') {
    return true;
  }

  // Otherwise, lock not acquired
  return false;
};

export const releaseLock = async (key: z.infer<typeof lockEnum>) => {
  const redis = getGlobalRedisConnection();
  const lockKey = `${lockPrefix}${key}`;

  // Delete the lock key
  const result = await redis.del(lockKey);

  // Return true if key was deleted (existed), false otherwise
  return result === 1;
};

export const withLock = async <T>(
  key: z.infer<typeof lockEnum>,
  timeoutMs: number,
  callback: () => Promise<T>
): Promise<T> => {
  // Try to acquire the lock
  const lockAcquired = await acquireLock(key, timeoutMs);

  if (!lockAcquired) {
    throw new Error(`Failed to acquire lock for key: ${key}`);
  }

  try {
    // Execute the callback function
    const result = await callback();
    return result;
  } finally {
    // Always release the lock in the finally block
    await releaseLock(key);
  }
};
