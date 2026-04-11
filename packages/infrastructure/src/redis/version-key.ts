import { randomUUID } from 'crypto';

import type { RedisClient } from './redis-client';

export type VersionKeyStoreDeps = {
  redisClient: RedisClient;
};

export class VersionKeyStore {
  private static instance: VersionKeyStore;
  protected versionKeyMap = new Map<string, string>();

  constructor(protected readonly deps: VersionKeyStoreDeps) {}

  public static getInstance(deps: VersionKeyStoreDeps): VersionKeyStore {
    if (!VersionKeyStore.instance) {
      VersionKeyStore.instance = new VersionKeyStore(deps);
    }
    return VersionKeyStore.instance;
  }

  protected generateVersionKey(): string {
    return randomUUID();
  }

  public async isVersionKeyExpired(key: string): Promise<boolean> {
    const localVersionKey = this.versionKeyMap.get(key);
    const versionKey = await this.deps.redisClient.getClient.get(key);
    if (!versionKey && !localVersionKey) {
      return false;
    }
    return versionKey !== localVersionKey;
  }

  public async refreshVersionKey(key: string): Promise<string> {
    const versionKey = this.generateVersionKey();
    const result = await this.deps.redisClient.getClient.set(key, versionKey);
    if (result === 'OK') {
      this.versionKeyMap.set(key, versionKey);
    }
    return versionKey;
  }
}
