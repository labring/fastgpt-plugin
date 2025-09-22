import type { SystemCacheKeyEnum } from './type';
import { randomUUID } from 'node:crypto';
import { initCache } from './init';
import { FASTGPT_REDIS_PREFIX, getGlobalRedisConnection } from '@/redis';
const getSynckey = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();
  const redis = getGlobalRedisConnection();
  const syncKey = `${FASTGPT_REDIS_PREFIX}:SYNC_KEY:${key}`;
  const val = await redis.get(syncKey);
  if (val) return val;
  const newVal = randomUUID();
  await redis.set(syncKey, newVal);
  return newVal;
};

export const refreshSyncKey = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();
  const val = randomUUID();
  const redis = getGlobalRedisConnection();
  await redis.set(`${FASTGPT_REDIS_PREFIX}:SYNC_KEY:${key}`, val);
};

export const getCachedData = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();

  const syncKey = await getSynckey(key);
  const isDisableCache = process.env.DISABLE_CACHE === 'true';

  if (global.systemCache[key].syncKey === syncKey && !isDisableCache) {
    return global.systemCache[key].data;
  }

  global.systemCache[key].syncKey = syncKey;
  global.systemCache[key].data = await global.systemCache[key].refreshFunc();

  return global.systemCache[key].data;
};
