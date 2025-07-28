# FastGPT 插件性能优化最佳实践

本文档提供了 FastGPT 插件开发中性能优化的最佳实践和示例代码。

## 性能优化原则

### 1. 性能优化的四个层次
- **算法优化**：选择合适的算法和数据结构
- **代码优化**：减少不必要的计算和内存分配
- **I/O优化**：优化网络请求和文件操作
- **缓存优化**：合理使用缓存减少重复计算

### 2. 性能指标
- **响应时间**：用户感知的处理延迟
- **吞吐量**：单位时间内处理的请求数
- **内存使用**：插件运行时的内存占用
- **CPU使用率**：处理过程中的CPU消耗

## 代码层面优化

### 1. 避免不必要的计算

```typescript
// ❌ 不好的做法：重复计算
export async function processData(items: any[]): Promise<any[]> {
  const results = [];
  for (const item of items) {
    // 每次都重新计算相同的值
    const baseValue = Math.sqrt(item.value) * Math.PI;
    const processed = item.data.map(d => d * baseValue);
    results.push(processed);
  }
  return results;
}

// ✅ 好的做法：缓存计算结果
export async function processDataOptimized(items: any[]): Promise<any[]> {
  const results = [];
  const computedValues = new Map<number, number>();
  
  for (const item of items) {
    // 缓存重复计算的值
    let baseValue = computedValues.get(item.value);
    if (baseValue === undefined) {
      baseValue = Math.sqrt(item.value) * Math.PI;
      computedValues.set(item.value, baseValue);
    }
    
    const processed = item.data.map(d => d * baseValue);
    results.push(processed);
  }
  return results;
}
```

### 2. 优化循环和数组操作

```typescript
// ❌ 不好的做法：多次遍历
export function processArray(data: number[]): number[] {
  const filtered = data.filter(x => x > 0);
  const doubled = filtered.map(x => x * 2);
  const summed = doubled.reduce((sum, x) => sum + x, 0);
  return doubled.map(x => x / summed);
}

// ✅ 好的做法：单次遍历
export function processArrayOptimized(data: number[]): number[] {
  const processed: number[] = [];
  let sum = 0;
  
  // 第一次遍历：过滤、转换并计算总和
  for (const x of data) {
    if (x > 0) {
      const doubled = x * 2;
      processed.push(doubled);
      sum += doubled;
    }
  }
  
  // 第二次遍历：归一化
  return processed.map(x => x / sum);
}
```

### 3. 内存优化

```typescript
// ❌ 不好的做法：创建大量临时对象
export function processLargeDataset(data: any[]): any[] {
  return data
    .map(item => ({ ...item, processed: true })) // 创建新对象
    .filter(item => item.isValid)
    .map(item => ({ ...item, timestamp: Date.now() })); // 再次创建新对象
}

// ✅ 好的做法：就地修改，减少对象创建
export function processLargeDatasetOptimized(data: any[]): any[] {
  const result: any[] = [];
  const timestamp = Date.now(); // 只计算一次
  
  for (const item of data) {
    if (item.isValid) {
      // 就地修改，避免创建新对象
      item.processed = true;
      item.timestamp = timestamp;
      result.push(item);
    }
  }
  
  return result;
}
```

## 异步操作优化

### 1. 并发处理

```typescript
// ❌ 不好的做法：串行处理
export async function processItemsSerial(items: any[]): Promise<any[]> {
  const results = [];
  for (const item of items) {
    const result = await processItem(item); // 串行等待
    results.push(result);
  }
  return results;
}

// ✅ 好的做法：并发处理
export async function processItemsConcurrent(items: any[]): Promise<any[]> {
  // 并发处理所有项目
  const promises = items.map(item => processItem(item));
  return Promise.all(promises);
}

// ✅ 更好的做法：限制并发数量
export async function processItemsWithLimit(
  items: any[], 
  concurrencyLimit: number = 5
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(item => processItem(item));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
```

### 2. 请求合并和批处理

```typescript
// 请求合并器
class RequestBatcher<T, R> {
  private pending: Array<{
    resolve: (value: R) => void;
    reject: (error: Error) => void;
    data: T;
  }> = [];
  
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private batchProcessor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private maxWaitTime: number = 100
  ) {}
  
  async add(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.pending.push({ resolve, reject, data });
      
      // 如果达到批处理大小，立即处理
      if (this.pending.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.timer) {
        // 设置定时器，确保不会等待太久
        this.timer = setTimeout(() => this.processBatch(), this.maxWaitTime);
      }
    });
  }
  
  private async processBatch() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const batch = this.pending.splice(0);
    if (batch.length === 0) return;
    
    try {
      const results = await this.batchProcessor(batch.map(item => item.data));
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error as Error);
      });
    }
  }
}

// 使用示例
const apiBatcher = new RequestBatcher(
  async (queries: string[]) => {
    // 批量调用API
    const response = await fetch('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ queries })
    });
    return response.json();
  },
  5, // 批处理大小
  200 // 最大等待时间（毫秒）
);

export async function queryApi(query: string): Promise<any> {
  return apiBatcher.add(query);
}
```

## 缓存策略

### 1. 内存缓存

```typescript
// LRU缓存实现
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  
  constructor(private maxSize: number) {}
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移到最后（最近使用）
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的项目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 带过期时间的缓存
class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  
  constructor(private defaultTTL: number = 300000) {} // 默认5分钟
  
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用示例
const resultCache = new LRUCache<string, any>(100);
const apiCache = new TTLCache<string, any>(60000); // 1分钟TTL

export async function cachedApiCall(query: string): Promise<any> {
  // 检查缓存
  const cached = apiCache.get(query);
  if (cached) {
    return cached;
  }
  
  // 调用API
  const result = await callExternalApi(query);
  
  // 缓存结果
  apiCache.set(query, result);
  
  return result;
}
```

### 2. 智能缓存策略

```typescript
// 缓存装饰器
export function cached<T extends (...args: any[]) => Promise<any>>(
  options: {
    ttl?: number;
    maxSize?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new TTLCache<string, any>(options.ttl);
    
    descriptor.value = async function (...args: Parameters<T>) {
      const key = options.keyGenerator 
        ? options.keyGenerator(...args)
        : JSON.stringify(args);
      
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(key, result);
      
      return result;
    };
    
    return descriptor;
  };
}

// 使用示例
class ApiService {
  @cached({ ttl: 300000, keyGenerator: (query) => `search:${query}` })
  async search(query: string): Promise<any> {
    return fetch(`/api/search?q=${query}`).then(r => r.json());
  }
  
  @cached({ ttl: 600000 })
  async getUserProfile(userId: string): Promise<any> {
    return fetch(`/api/users/${userId}`).then(r => r.json());
  }
}
```

## 网络优化

### 1. 连接池和Keep-Alive

```typescript
// HTTP客户端优化
class OptimizedHttpClient {
  private agent: any;
  
  constructor() {
    // 使用连接池
    this.agent = new (require('https').Agent)({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
      freeSocketTimeout: 30000
    });
  }
  
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      agent: this.agent,
      headers: {
        'Connection': 'keep-alive',
        ...options.headers
      }
    });
  }
}

const httpClient = new OptimizedHttpClient();
```

### 2. 请求压缩和优化

```typescript
// 请求压缩
export async function compressedRequest(
  url: string, 
  data: any
): Promise<any> {
  const compressed = await compress(JSON.stringify(data));
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Accept-Encoding': 'gzip, deflate'
    },
    body: compressed
  });
}

// 分块上传大数据
export async function uploadLargeData(
  url: string, 
  data: any[], 
  chunkSize: number = 1000
): Promise<any[]> {
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const result = await fetch(`${url}/chunk`, {
      method: 'POST',
      body: JSON.stringify(chunk)
    }).then(r => r.json());
    
    results.push(...result);
  }
  
  return results;
}
```

## 性能监控

### 1. 性能指标收集

```typescript
// 性能监控器
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // 保持最近1000个记录
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getStats(operation: string): {
    avg: number;
    min: number;
    max: number;
    p95: number;
    count: number;
  } | null {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    return {
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index],
      count: values.length
    };
  }
  
  report(): void {
    console.log('=== 性能报告 ===');
    for (const [operation, _] of this.metrics) {
      const stats = this.getStats(operation);
      if (stats) {
        console.log(`${operation}:`, {
          平均耗时: `${stats.avg.toFixed(2)}ms`,
          最小耗时: `${stats.min.toFixed(2)}ms`,
          最大耗时: `${stats.max.toFixed(2)}ms`,
          P95耗时: `${stats.p95.toFixed(2)}ms`,
          调用次数: stats.count
        });
      }
    }
  }
}

const monitor = new PerformanceMonitor();

// 使用示例
export async function monitoredFunction(data: any): Promise<any> {
  const endTimer = monitor.startTimer('data_processing');
  
  try {
    const result = await processData(data);
    return result;
  } finally {
    endTimer();
  }
}
```

### 2. 内存使用监控

```typescript
// 内存监控
export function monitorMemoryUsage(): void {
  const usage = process.memoryUsage();
  
  console.log('内存使用情况:', {
    RSS: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    堆总量: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    堆使用: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    外部内存: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
  });
}

// 内存泄漏检测
export function detectMemoryLeaks(): void {
  let baseline: NodeJS.MemoryUsage | null = null;
  
  setInterval(() => {
    const current = process.memoryUsage();
    
    if (baseline) {
      const heapGrowth = current.heapUsed - baseline.heapUsed;
      if (heapGrowth > 50 * 1024 * 1024) { // 50MB增长
        console.warn('可能存在内存泄漏:', {
          增长量: `${(heapGrowth / 1024 / 1024).toFixed(2)} MB`,
          当前堆使用: `${(current.heapUsed / 1024 / 1024).toFixed(2)} MB`
        });
      }
    }
    
    baseline = current;
  }, 60000); // 每分钟检查一次
}
```

## 性能测试

### 1. 基准测试

```typescript
import { describe, it, expect } from 'vitest';

describe('性能测试', () => {
  it('应该在合理时间内完成处理', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: Math.random() }));
    
    const start = performance.now();
    const result = await processLargeDataset(largeData);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    expect(result).toHaveLength(largeData.length);
  });
  
  it('内存使用应该保持稳定', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 处理多批数据
    for (let i = 0; i < 100; i++) {
      const data = Array.from({ length: 1000 }, (_, j) => ({ id: j, value: Math.random() }));
      await processData(data);
    }
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    // 内存增长应该小于10MB
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 总结

性能优化是一个持续的过程，需要：

1. **测量优先**：先测量，再优化
2. **找到瓶颈**：识别真正的性能瓶颈
3. **渐进优化**：逐步优化，避免过度优化
4. **持续监控**：建立性能监控体系
5. **平衡权衡**：在性能和代码可读性之间找到平衡

记住：**过早的优化是万恶之源，但忽视性能同样危险**。