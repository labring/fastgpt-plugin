import type { SystemCacheKeyEnum } from './type';
import { randomUUID } from 'node:crypto';
import { initCache } from './init';
import { env } from '@/env';
import { getLogger } from '@logtape/logtape';
import { getGlobalRedisConnection } from '../redis';
import { infra } from '../logger';

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

  const logger = getLogger(infra.redis);

  logger.info('refreshing cache key', {
    key
  });
  await redis.set(`${cachePrefix}${key}`, val);
};

export const getCachedData = async (key: `${SystemCacheKeyEnum}`) => {
  if (!global.systemCache) initCache();

  const versionKey = await getVersionKey(key);
  const isDisableCache = env.DISABLE_CACHE;

  if (global.systemCache[key].versionKey === versionKey && !isDisableCache) {
    return global.systemCache[key].data;
  }

  const logger = getLogger(infra.redis);

  logger.info('refreshing cache data', {
    key
  });

  global.systemCache[key].versionKey = versionKey;
  global.systemCache[key].data = await global.systemCache[key].refreshFunc();

  return global.systemCache[key].data;
};
