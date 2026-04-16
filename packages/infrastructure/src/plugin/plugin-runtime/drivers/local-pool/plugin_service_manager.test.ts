import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// import type { GlobalConfig, ServiceConfig } from './types';

describe('PluginServiceManager - 多插件管理', () => {
  let manager: PluginServiceManager;
  const pluginPath = path.join(__dirname, 'example_plugin_v2.ts');
  const globalConfig: GlobalConfig = {
    maxTotalPods: 20
  };

  const weatherConfig: ServiceConfig = {
    minPods: 2,
    maxPods: 5,
    idleTimeout: 5000,
    podTimeout: 10000,
    maxRequestsPerPod: 100,
    maxQueueSize: 50,
    maxConcurrentRequestsPerPod: 10
  };

  const translateConfig: ServiceConfig = {
    minPods: 1,
    maxPods: 3,
    idleTimeout: 5000,
    podTimeout: 10000,
    maxRequestsPerPod: 100,
    maxQueueSize: 30,
    maxConcurrentRequestsPerPod: 10
  };

  beforeEach(() => {
    manager = new PluginServiceManager(globalConfig);
  });

  afterEach(async () => {
    await manager.destroy();
  });

  describe('服务注册与注销', () => {
    it('应该成功注册插件服务', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(1);
    });

    it('应该支持注册多个插件服务', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(2);
    });

    it('应该拒绝重复注册同名服务', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);

      await expect(manager.registerService('weather', pluginPath, weatherConfig)).rejects.toThrow(
        'Service already exists'
      );
    });

    it('应该成功注销插件服务', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.unregisterService('weather');

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(0);
    });

    it('应该在注销不存在的服务时抛出错误', async () => {
      await expect(manager.unregisterService('nonexistent')).rejects.toThrow(
        'Service does not exist'
      );
    });

    it('应该在注销服务时等待所有请求完成', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);

      const longRequest = manager.invoke('weather', 'slowMethod', { delay: 500 });
      const unregisterPromise = manager.unregisterService('weather');

      const result = await longRequest;
      expect(result).toBeDefined();

      await unregisterPromise;
      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(0);
    });
  });

  describe('invoke 路由', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);
    });

    it('应该正确路由到指定服务', async () => {
      const weatherResult = await manager.invoke('weather', 'getTemperature', { city: 'Beijing' });
      const translateResult = await manager.invoke('translate', 'translate', {
        text: 'hello',
        to: 'zh'
      });

      expect(weatherResult).toBeDefined();
      expect(translateResult).toBeDefined();
    });

    it('应该在调用不存在的服务时抛出错误', async () => {
      await expect(manager.invoke('nonexistent', 'method', {})).rejects.toThrow(
        'Service does not exist'
      );
    });

    it('应该支持并发调用多个服务', async () => {
      const requests = [
        manager.invoke('weather', 'getTemperature', { city: 'Beijing' }),
        manager.invoke('weather', 'getTemperature', { city: 'Shanghai' }),
        manager.invoke('translate', 'translate', { text: 'hello', to: 'zh' }),
        manager.invoke('translate', 'translate', { text: 'world', to: 'zh' })
      ];

      const results = await Promise.all(requests);
      expect(results).toHaveLength(4);
    });

    it('应该隔离不同服务的错误', async () => {
      // weather 服务出错不应该影响 translate 服务
      await manager.invoke('weather', 'errorMethod', {}).catch(() => {});

      const translateResult = await manager.invoke('translate', 'translate', {
        text: 'hello',
        to: 'zh'
      });
      expect(translateResult).toBeDefined();
    });
  });

  describe('全局配额控制', () => {
    it('应该限制所有服务的总 Pod 数', async () => {
      const managerWithLimit = new PluginServiceManager({ maxTotalPods: 10 });

      await managerWithLimit.registerService('service1', pluginPath, {
        minPods: 3,
        maxPods: 8,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      await managerWithLimit.registerService('service2', pluginPath, {
        minPods: 3,
        maxPods: 8,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      // 触发扩展
      const requests = Array.from({ length: 20 }, (_, i) =>
        managerWithLimit.invoke(i % 2 === 0 ? 'service1' : 'service2', 'slowMethod', { delay: 100 })
      );

      await new Promise((r) => setTimeout(r, 50));

      const globalMetrics = managerWithLimit.getGlobalMetrics();
      expect(globalMetrics.totalPods).toBeLessThanOrEqual(10);

      await Promise.all(requests);
      await managerWithLimit.destroy();
    });

    it('应该在达到全局配额时阻止新 Pod 创建', async () => {
      const managerWithLimit = new PluginServiceManager({ maxTotalPods: 5 });

      await managerWithLimit.registerService('service1', pluginPath, {
        minPods: 2,
        maxPods: 10,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      await managerWithLimit.registerService('service2', pluginPath, {
        minPods: 2,
        maxPods: 10,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      // 已经有 4 个 Pod (2+2)，只能再创建 1 个
      const globalMetrics = managerWithLimit.getGlobalMetrics();
      expect(globalMetrics.totalPods).toBe(4);

      // 尝试触发扩展
      const requests = Array.from({ length: 10 }, () =>
        managerWithLimit.invoke('service1', 'slowMethod', { delay: 100 })
      );

      await new Promise((r) => setTimeout(r, 50));

      const updatedMetrics = managerWithLimit.getGlobalMetrics();
      expect(updatedMetrics.totalPods).toBeLessThanOrEqual(5);

      await Promise.all(requests);
      await managerWithLimit.destroy();
    });

    it('应该在服务注销时释放全局配额', async () => {
      await manager.registerService('service1', '/plugins/s1.js', weatherConfig);
      await manager.registerService('service2', '/plugins/s2.js', translateConfig);

      let globalMetrics = manager.getGlobalMetrics();
      const initialPods = globalMetrics.totalPods;

      await manager.unregisterService('service1');

      globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalPods).toBeLessThan(initialPods);
    });
  });

  describe('插件隔离', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);
    });

    it('应该为每个插件维护独立的队列', async () => {
      // 占用 weather 服务的所有 Pod
      const weatherRequests = Array.from({ length: 10 }, () =>
        manager.invoke('weather', 'slowMethod', { delay: 500 })
      );

      await new Promise((r) => setTimeout(r, 50));

      // translate 服务应该不受影响
      const translateResult = await manager.invoke('translate', 'translate', {
        text: 'hello',
        to: 'zh'
      });
      expect(translateResult).toBeDefined();

      await Promise.all(weatherRequests);
    });

    it('应该为每个插件维护独立的 Pod 池', async () => {
      const weatherMetrics = manager.getServiceMetrics('weather');
      const translateMetrics = manager.getServiceMetrics('translate');

      expect(weatherMetrics.pods.total).toBe(weatherConfig.minPods);
      expect(translateMetrics.pods.total).toBe(translateConfig.minPods);
    });

    it('应该隔离不同插件的崩溃影响', async () => {
      // weather 服务崩溃
      await manager.invoke('weather', 'crashPod', {}).catch(() => {});

      await new Promise((r) => setTimeout(r, 100));

      // translate 服务应该正常工作
      const translateResult = await manager.invoke('translate', 'translate', {
        text: 'hello',
        to: 'zh'
      });
      expect(translateResult).toBeDefined();

      // weather 服务应该自动恢复
      const weatherResult = await manager.invoke('weather', 'getTemperature', { city: 'Beijing' });
      expect(weatherResult).toBeDefined();
    });
  });

  describe('全局监控指标', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);
    });

    it('应该提供完整的全局指标', () => {
      const globalMetrics = manager.getGlobalMetrics();

      expect(globalMetrics).toMatchObject({
        totalServices: expect.any(Number),
        totalPods: expect.any(Number),
        totalRequests: expect.any(Number),
        avgResponseTime: expect.any(Number),
        errorRate: expect.any(Number)
      });
    });

    it('应该正确统计所有服务的总请求数', async () => {
      await manager.invoke('weather', 'getTemperature', { city: 'Beijing' });
      await manager.invoke('translate', 'translate', { text: 'hello', to: 'zh' });
      await manager.invoke('weather', 'getTemperature', { city: 'Shanghai' });

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalRequests).toBe(3);
    });

    it('应该正确计算全局错误率', async () => {
      await manager.invoke('weather', 'getTemperature', { city: 'Beijing' });
      await manager.invoke('weather', 'errorMethod', {}).catch(() => {});
      await manager.invoke('translate', 'translate', { text: 'hello', to: 'zh' });

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.errorRate).toBeCloseTo(1 / 3);
    });

    it('应该正确计算全局平均响应时间', async () => {
      await manager.invoke('weather', 'slowMethod', { delay: 100 });
      await manager.invoke('translate', 'slowMethod', { delay: 200 });

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.avgResponseTime).toBeGreaterThan(100);
    });
  });

  describe('服务级别监控指标', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);
    });

    it('应该获取指定服务的指标', () => {
      const weatherMetrics = manager.getServiceMetrics('weather');

      expect(weatherMetrics).toMatchObject({
        pods: {
          total: expect.any(Number),
          running: expect.any(Number),
          busy: expect.any(Number),
          idle: expect.any(Number)
        },
        queueLength: expect.any(Number),
        responseTime: {
          avg: expect.any(Number),
          p95: expect.any(Number)
        },
        rps: expect.any(Number),
        errorRate: expect.any(Number),
        crashCount: expect.any(Number)
      });
    });

    it('应该在获取不存在的服务指标时抛出错误', () => {
      expect(() => manager.getServiceMetrics('nonexistent')).toThrow('Service does not exist');
    });

    it('应该独立统计每个服务的指标', async () => {
      await manager.invoke('weather', 'getTemperature', { city: 'Beijing' });
      await manager.invoke('weather', 'getTemperature', { city: 'Shanghai' });
      await manager.invoke('translate', 'translate', { text: 'hello', to: 'zh' });

      const weatherMetrics = manager.getServiceMetrics('weather');
      const translateMetrics = manager.getServiceMetrics('translate');

      expect(weatherMetrics.totalRequests).toBe(2);
      expect(translateMetrics.totalRequests).toBe(1);
    });
  });

  describe('事件系统', () => {
    it('应该触发 serviceRegistered 事件', async () => {
      const handler = vi.fn();
      manager.on('serviceRegistered', handler);

      await manager.registerService('weather', pluginPath, weatherConfig);

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ serviceName: 'weather' }));
    });

    it('应该触发 serviceUnregistered 事件', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);

      const handler = vi.fn();
      manager.on('serviceUnregistered', handler);

      await manager.unregisterService('weather');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ serviceName: 'weather' }));
    });

    it('应该触发 quotaExceeded 事件', async () => {
      const managerWithLimit = new PluginServiceManager({ maxTotalPods: 5 });
      const handler = vi.fn();
      managerWithLimit.on('quotaExceeded', handler);

      await managerWithLimit.registerService('service1', pluginPath, {
        minPods: 2,
        maxPods: 10,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      await managerWithLimit.registerService('service2', pluginPath, {
        minPods: 2,
        maxPods: 10,
        idleTimeout: 5000,
        podTimeout: 10000,
        maxRequestsPerPod: 100,
        maxQueueSize: 50,
        maxConcurrentRequestsPerPod: 10
      });

      // 尝试触发超过配额的扩展
      const requests = Array.from({ length: 20 }, () =>
        managerWithLimit.invoke('service1', 'slowMethod', { delay: 100 })
      );

      await new Promise((r) => setTimeout(r, 100));

      expect(handler).toHaveBeenCalled();

      await Promise.all(requests);
      await managerWithLimit.destroy();
    });
  });

  describe('优雅关闭', () => {
    it('应该等待所有服务的请求完成后关闭', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);

      const weatherRequest = manager.invoke('weather', 'slowMethod', { delay: 500 });
      const translateRequest = manager.invoke('translate', 'slowMethod', { delay: 500 });

      const destroyPromise = manager.destroy();

      const results = await Promise.all([weatherRequest, translateRequest]);
      expect(results).toHaveLength(2);

      await destroyPromise;

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(0);
      expect(globalMetrics.totalPods).toBe(0);
    });

    it('应该支持强制关闭所有服务', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);

      manager.invoke('weather', 'slowMethod', { delay: 10000 }).catch(() => {});
      manager.invoke('translate', 'slowMethod', { delay: 10000 }).catch(() => {});

      await manager.destroy({ force: true, timeout: 100 });

      const globalMetrics = manager.getGlobalMetrics();
      expect(globalMetrics.totalServices).toBe(0);
      expect(globalMetrics.totalPods).toBe(0);
    });

    it('应该在关闭后拒绝新的服务注册', async () => {
      await manager.destroy();

      await expect(
        manager.registerService('weather', '/plugins/weather.js', weatherConfig)
      ).rejects.toThrow('Manager already closed');
    });

    it('应该在关闭后拒绝新的调用请求', async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.destroy();

      await expect(manager.invoke('weather', 'method', {})).rejects.toThrow(
        'Manager already closed'
      );
    });
  });

  describe('动态配置更新', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
    });

    it('应该支持更新服务配置', async () => {
      const newConfig: ServiceConfig = {
        ...weatherConfig,
        maxPods: 10
      };

      await manager.updateServiceConfig('weather', newConfig);

      const metrics = manager.getServiceMetrics('weather');
      // 配置已更新，可以扩展到 10 个 Pod
      expect(metrics.maxPods).toBe(10);
    });

    it('应该在更新不存在的服务配置时抛出错误', async () => {
      await expect(manager.updateServiceConfig('nonexistent', weatherConfig)).rejects.toThrow(
        'Service does not exist'
      );
    });
  });

  describe('健康检查', () => {
    beforeEach(async () => {
      await manager.registerService('weather', pluginPath, weatherConfig);
      await manager.registerService('translate', pluginPath, translateConfig);
    });

    it('应该定期检查所有服务的健康状态', async () => {
      const handler = vi.fn();
      manager.on('healthCheck', handler);

      await new Promise((r) => setTimeout(r, 3000));

      expect(handler).toHaveBeenCalled();
    });

    it('应该检测并报告不健康的服务', async () => {
      const handler = vi.fn();
      manager.on('serviceUnhealthy', handler);

      // 模拟服务变得不健康
      await manager.invoke('weather', 'hangMethod', {}).catch(() => {});

      await new Promise((r) => setTimeout(r, weatherConfig.podTimeout + 1000));

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ serviceName: 'weather' }));
    });
  });
});
