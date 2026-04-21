import { randomUUID } from 'crypto';

import type { RedisClient } from './redis-client';

export type VersionKeyStoreDeps = {
  redisClient: RedisClient;
};

export class VersionKeyStore {
  private versionKeyMap = new Map<string, string>();

  public constructor(
    private readonly deps: VersionKeyStoreDeps,
    private prefix: string
  ) {}

  private generateVersionKey(): string {
    return randomUUID();
  }

  private getRedisKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public async isVersionKeyExpired(key: string): Promise<boolean> {
    const localVersionKey = this.versionKeyMap.get(key);
    const versionKey = await this.deps.redisClient.getClient.get(this.getRedisKey(key));
    if (!versionKey && !localVersionKey) {
      return false;
    }
    return versionKey !== localVersionKey;
  }

  public async refreshVersionKey(key: string): Promise<string> {
    const versionKey = this.generateVersionKey();
    const result = await this.deps.redisClient.getClient.set(this.getRedisKey(key), versionKey);

    if (result === 'OK') {
      this.versionKeyMap.set(key, versionKey);
    }
    return versionKey;
  }
}
