import type { SystemCacheKeyEnum } from './type';
import { randomUUID } from 'node:crypto';
import { initCache } from './init';
import { getGlobalRedisConnection } from '@/redis';

const cachePrefix = `VERSION_KEY:`;

const getVersionKey = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();
  const redis = getGlobalRedisConnection();
  const syncKey = `${cachePrefix}${key}`;
  const val = await redis.get(syncKey);
  if (val) return val;
  const newVal = randomUUID();
  await redis.set(syncKey, newVal);
  return newVal;
};

export const refreshVersionKey = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();
  const val = randomUUID();
  const redis = getGlobalRedisConnection();
  await redis.set(`${cachePrefix}${key}`, val);
};

export const getCachedData = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();

  const versionKey = await getVersionKey(key);
  const isDisableCache = process.env.DISABLE_CACHE === 'true';

  if (global.systemCache[key].versionKey === versionKey && !isDisableCache) {
    return global.systemCache[key].data;
  }

  global.systemCache[key].versionKey = versionKey;
  global.systemCache[key].data = await global.systemCache[key].refreshFunc();

  return global.systemCache[key].data;
};
