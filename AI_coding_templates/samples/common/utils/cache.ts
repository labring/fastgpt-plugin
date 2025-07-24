/**
 * 缓存项接口
 */
interface CacheItem<T> {
  value: T;
  expiry: number;
  hits: number;
  created: number;
}

/**
 * 缓存统计接口
 */
interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalRequests: number;
}

/**
 * 内存缓存类
 * 提供高性能的内存缓存功能
 */
export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private totalRequests = 0;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 默认5分钟
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间（毫秒）
   */
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);

    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      expiry,
      hits: 0,
      created: Date.now()
    });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或undefined
   */
  get(key: string): T | undefined {
    this.totalRequests++;
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // 增加命中次数
    item.hits++;

    return item.value;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.totalRequests = 0;
  }

  /**
   * 检查是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取缓存大小
   * @returns 缓存项数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有缓存键
   * @returns 缓存键数组
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存统计
   * @returns 缓存统计信息
   */
  getStats(): CacheStats {
    let totalHits = 0;

    for (const item of this.cache.values()) {
      totalHits += item.hits;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.totalRequests > 0 ? totalHits / this.totalRequests : 0,
      totalHits,
      totalRequests: this.totalRequests
    };
  }

  /**
   * 清理过期项
   * @returns 清理的项目数量
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 更新TTL
   * @param key 缓存键
   * @param ttl 新的TTL
   * @returns 是否更新成功
   */
  updateTTL(key: string, ttl: number): boolean {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + ttl;
      return true;
    }
    return false;
  }

  /**
   * 获取缓存项信息
   * @param key 缓存键
   * @returns 缓存项信息
   */
  getItemInfo(key: string): { hits: number; created: number; expiry: number } | undefined {
    const item = this.cache.get(key);
    if (item) {
      return {
        hits: item.hits,
        created: item.created,
        expiry: item.expiry
      };
    }
    return undefined;
  }

  /**
   * 驱逐最少使用的项
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | undefined;
    let leastHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.hits < leastHits || (item.hits === leastHits && item.created < oldestTime)) {
        leastUsedKey = key;
        leastHits = item.hits;
        oldestTime = item.created;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}

/**
 * 缓存装饰器
 * 为方法添加缓存功能
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  cache: MemoryCache<any>,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyKey}_${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * LRU缓存类
 * 最近最少使用缓存实现
 */
export class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 获取值
   * @param key 键
   * @returns 值或undefined
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 重新设置以更新顺序
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * 设置值
   * @param key 键
   * @param value 值
   */
  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项（第一个）
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  /**
   * 删除值
   * @param key 键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取大小
   * @returns 缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查是否存在
   * @param key 键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

/**
 * 缓存管理器
 * 管理多个缓存实例
 */
export class CacheManager {
  private caches = new Map<string, MemoryCache<any>>();

  /**
   * 创建缓存
   * @param name 缓存名称
   * @param maxSize 最大大小
   * @param defaultTTL 默认TTL
   * @returns 缓存实例
   */
  createCache<T>(
    name: string,
    maxSize: number = 1000,
    defaultTTL: number = 300000
  ): MemoryCache<T> {
    const cache = new MemoryCache<T>(maxSize, defaultTTL);
    this.caches.set(name, cache);
    return cache;
  }

  /**
   * 获取缓存
   * @param name 缓存名称
   * @returns 缓存实例或undefined
   */
  getCache<T>(name: string): MemoryCache<T> | undefined {
    return this.caches.get(name);
  }

  /**
   * 删除缓存实例
   * @param name 缓存名称
   * @returns 是否删除成功
   */
  deleteCache(name: string): boolean {
    this.caches.get(name)?.clear();
    return this.caches.delete(name);
  }

  /**
   * 清理所有缓存的过期项
   * @returns 清理的总项目数
   */
  cleanupAll(): number {
    let totalCleaned = 0;
    for (const cache of this.caches.values()) {
      totalCleaned += cache.cleanup();
    }
    return totalCleaned;
  }

  /**
   * 获取所有缓存的统计信息
   * @returns 统计信息对象
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}

// 全局缓存管理器实例
export const globalCacheManager = new CacheManager();
