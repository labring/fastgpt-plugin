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

  public async syncVersionKey(key: string): Promise<string | null> {
    const versionKey = await this.deps.redisClient.getClient.get(this.getRedisKey(key));

    if (versionKey) {
      this.versionKeyMap.set(key, versionKey);
    } else {
      this.versionKeyMap.delete(key);
    }

    return versionKey;
  }

  public async ensureVersionKey(key: string): Promise<string> {
    const redisKey = this.getRedisKey(key);
    const versionKey = this.generateVersionKey();
    const result = await this.deps.redisClient.getClient.set(redisKey, versionKey, 'NX');

    if (result === 'OK') {
      this.versionKeyMap.set(key, versionKey);
      return versionKey;
    }

    return (await this.syncVersionKey(key)) ?? this.refreshVersionKey(key);
  }

  public async refreshVersionKey(
    key: string,
    options: { syncLocal?: boolean } = {}
  ): Promise<string> {
    const versionKey = this.generateVersionKey();
    const result = await this.deps.redisClient.getClient.set(this.getRedisKey(key), versionKey);

    if (result === 'OK' && (options.syncLocal ?? true)) {
      this.versionKeyMap.set(key, versionKey);
    }
    return versionKey;
  }
}
