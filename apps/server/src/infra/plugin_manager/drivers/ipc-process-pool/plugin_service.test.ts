import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginService } from './plugin_service';
import type { ServiceConfig } from './types';
import path from 'node:path';

describe('PluginService - 单插件进程池管理', () => {
  let service: PluginService;
  const pluginPath = path.join(__dirname, 'example_plugin_v2.ts');
  const defaultConfig: ServiceConfig = {
    minPods: 2,
    maxPods: 5,
    idleTimeout: 5000,
    podTimeout: 10000,
    maxRequestsPerPod: 100,
    maxQueueSize: 50,
    maxConcurrentRequestsPerPod: 10
  };

  beforeEach(() => {
    service = new PluginService('test-plugin', pluginPath, defaultConfig);
  });

  afterEach(async () => {
    await service.destroy();
  });

  describe('初始化与配置', () => {
    it('应该创建指定数量的最小 Pod', async () => {
      await service.initialize();
      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBe(defaultConfig.minPods);
      expect(metrics.pods.idle).toBe(defaultConfig.minPods);
    });

    it('应该验证配置参数的有效性', () => {
      expect(() => new PluginService('test', '/path', { ...defaultConfig, minPods: -1 })).toThrow();
      expect(() => new PluginService('test', '/path', { ...defaultConfig, maxPods: 0 })).toThrow();
      expect(() => new PluginService('test', '/path', { ...defaultConfig, minPods: 10, maxPods: 5 })).toThrow();
    });

    it('应该只允许初始化一次', async () => {
      await service.initialize();
      await expect(service.initialize()).rejects.toThrow('Service already initialized');
    });
  });

  describe('invoke 调度流程', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('应该成功调用插件方法', async () => {
      const result = await service.invoke('add', { a: 1, b: 2 });
      expect(result).toBeDefined();
    });

    it('应该并发处理多个请求', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        service.invoke('multiply', { a: i, b: 2 })
      );
      const results = await Promise.all(requests);
      expect(results).toHaveLength(10);
    });

    it('应该在请求超时时终止执行', async () => {
      await expect(
        service.invoke('slowMethod', { delay: 20000 }, { timeout: 1000 })
      ).rejects.toThrow('timeout');
    });

    it('应该处理插件方法执行错误', async () => {
      await expect(
        service.invoke('throwError', {})
      ).rejects.toThrow();
    });
  });

  describe('Pod 生命周期管理', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('应该根据负载动态扩展 Pod', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        service.invoke('slowMethod', { delay: 100 })
      );

      await new Promise(r => setTimeout(r, 50));
      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBeGreaterThan(defaultConfig.minPods);
      expect(metrics.pods.total).toBeLessThanOrEqual(defaultConfig.maxPods);

      await Promise.all(requests);
    });

    it('应该在空闲时回收多余的 Pod', async () => {
      // 触发扩展
      const requests = Array.from({ length: 10 }, () =>
        service.invoke('quickMethod', {})
      );
      await Promise.all(requests);

      // 等待空闲超时
      await new Promise(r => setTimeout(r, defaultConfig.idleTimeout + 1000));

      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBe(defaultConfig.minPods);
    });

    it('应该在 Pod 崩溃后自动补充', async () => {
      await service.invoke('crashPod', {}).catch(() => {});
      await new Promise(r => setTimeout(r, 100));

      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBe(defaultConfig.minPods);
    });

    it('应该限制单个 Pod 的最大请求数', async () => {
      const serviceWithLimit = new PluginService('test', '/path', {
        ...defaultConfig,
        maxRequestsPerPod: 5,
      });
      await serviceWithLimit.initialize();

      const requests = Array.from({ length: 10 }, () =>
        serviceWithLimit.invoke('method', {})
      );
      await Promise.all(requests);

      const metrics = serviceWithLimit.getMetrics();
      expect(metrics.pods.total).toBeGreaterThan(1);

      await serviceWithLimit.destroy();
    });
  });

  describe('队列管理', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('应该在 Pod 不足时将请求排队', async () => {
      const serviceWithLimit = new PluginService('test', '/path', {
        minPods: 1,
        maxPods: 2,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 1,
        maxQueueSize: 10,
        maxConcurrentRequestsPerPod: 10
      });
      await serviceWithLimit.initialize();

      const requests = Array.from({ length: 5 }, () =>
        serviceWithLimit.invoke('slowMethod', { delay: 200 })
      );

      await new Promise(r => setTimeout(r, 50));
      const metrics = serviceWithLimit.getMetrics();
      expect(metrics.queueLength).toBeGreaterThan(0);

      await Promise.all(requests);
      await serviceWithLimit.destroy();
    });

    it('应该在队列满时拒绝新请求', async () => {
      const serviceWithSmallQueue = new PluginService('test', '/path', {
        minPods: 1,
        maxPods: 1,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 1,
        maxQueueSize: 2,
        maxConcurrentRequestsPerPod: 10
      });
      await serviceWithSmallQueue.initialize();

      // 占用所有 Pod
      const blockingRequests = Array.from({ length: 1 }, () =>
        serviceWithSmallQueue.invoke('slowMethod', { delay: 1000 })
      );

      // 填满队列
      const queuedRequests = Array.from({ length: 2 }, () =>
        serviceWithSmallQueue.invoke('method', {})
      );

      // 应该拒绝新请求
      await expect(
        serviceWithSmallQueue.invoke('method', {})
      ).rejects.toThrow('Queue is full');

      await Promise.all([...blockingRequests, ...queuedRequests]);
      await serviceWithSmallQueue.destroy();
    });

    it('应该在队列等待超时时拒绝请求', async () => {
      const serviceWithTimeout = new PluginService('test', '/path', {
        minPods: 1,
        maxPods: 1,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 1,
        maxQueueSize: 10,
        queueTimeout: 500,
        maxConcurrentRequestsPerPod: 10
      });
      await serviceWithTimeout.initialize();

      // 占用所有 Pod
      const blockingRequest = serviceWithTimeout.invoke('slowMethod', { delay: 2000 });

      // 应该在队列等待超时
      await expect(
        serviceWithTimeout.invoke('method', {})
      ).rejects.toThrow('Queue wait timeout');

      await blockingRequest.catch(() => {});
      await serviceWithTimeout.destroy();
    });
  });

  describe('IPC 通信协议', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('应该正确处理 Ready 信号', async () => {
      const readyHandler = vi.fn();
      service.on('podReady', readyHandler);

      // 创建新 Pod 应该触发 ready 事件
      await service.invoke('method', {});
      expect(readyHandler).toHaveBeenCalled();
    });

    it('应该在消息中包含 traceId', async () => {
      const messageHandler = vi.fn();
      service.on('message', messageHandler);

      await service.invoke('method', {}, { traceId: 'test-trace-123' });

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({ traceId: 'test-trace-123' })
      );
    });

    it('应该正确处理错误响应', async () => {
      await expect(
        service.invoke('errorMethod', {})
      ).rejects.toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
      });
    });
  });

  describe('监控指标', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('应该提供完整的 Service 指标', () => {
      const metrics = service.getMetrics();

      expect(metrics).toMatchObject({
        pods: {
          total: expect.any(Number),
          running: expect.any(Number),
          busy: expect.any(Number),
          idle: expect.any(Number),
        },
        queueLength: expect.any(Number),
        responseTime: {
          avg: expect.any(Number),
          p95: expect.any(Number),
        },
        rps: expect.any(Number),
        errorRate: expect.any(Number),
        crashCount: expect.any(Number),
      });
    });

    it('应该正确统计请求数和错误率', async () => {
      await service.invoke('method', {});
      await service.invoke('method', {});
      await service.invoke('errorMethod', {}).catch(() => {});

      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.errorRate).toBeCloseTo(1 / 3);
    });

    it('应该正确计算响应时间', async () => {
      await service.invoke('slowMethod', { delay: 100 });
      await service.invoke('slowMethod', { delay: 200 });

      const metrics = service.getMetrics();
      expect(metrics.responseTime.avg).toBeGreaterThan(100);
      expect(metrics.responseTime.p95).toBeGreaterThan(100);
    });
  });

  describe('优雅关闭', () => {
    it('应该等待所有请求完成后关闭', async () => {
      await service.initialize();

      const longRequest = service.invoke('slowMethod', { delay: 500 });
      const destroyPromise = service.destroy();

      const result = await longRequest;
      expect(result).toBeDefined();

      await destroyPromise;
      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBe(0);
    });

    it('应该支持强制关闭', async () => {
      await service.initialize();

      service.invoke('slowMethod', { delay: 10000 }).catch(() => {});
      await service.destroy({ force: true, timeout: 100 });

      const metrics = service.getMetrics();
      expect(metrics.pods.total).toBe(0);
    });

    it('应该拒绝关闭后的新请求', async () => {
      await service.initialize();
      await service.destroy();

      await expect(
        service.invoke('method', {})
      ).rejects.toThrow('Service already closed');
    });
  });
});
