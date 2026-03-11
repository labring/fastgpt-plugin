/**
 * 使用示例 - 展示如何使用 FastGPT Plugin Pool
 */

import { PluginServiceManager } from './index';
import path from 'node:path';

async function main() {
  console.log('=== FastGPT Plugin Pool 使用示例 ===\n');

  // 1. 创建管理器
  console.log('1. 创建 PluginServiceManager...');
  const manager = new PluginServiceManager({
    maxTotalPods: 20,
    healthCheckInterval: 30000,
  });

  // 监听事件
  manager.on('serviceRegistered', ({ serviceName }) => {
    console.log(`✓ 服务已注册: ${serviceName}`);
  });

  manager.on('quotaExceeded', ({ requested, available }) => {
    console.warn(`⚠ 配额超限: 请求 ${requested}, 可用 ${available}`);
  });

  try {
    // 2. 注册插件服务
    console.log('\n2. 注册插件服务...');
    const pluginPath = path.join(__dirname, 'example_plugin.js');

    await manager.registerService('calculator', pluginPath, {
      minPods: 2,
      maxPods: 5,
      idleTimeout: 60000,
      podTimeout: 10000,
      maxRequestsPerPod: 100,
      maxQueueSize: 50,
    });

    console.log('✓ 插件服务注册成功\n');

    // 3. 调用插件方法
    console.log('3. 调用插件方法...\n');

    // 基础运算
    console.log('--- 基础运算 ---');
    const addResult = await manager.invoke('calculator', 'add', { a: 10, b: 20 });
    console.log('add(10, 20) =', addResult);

    const multiplyResult = await manager.invoke('calculator', 'multiply', { a: 5, b: 6 });
    console.log('multiply(5, 6) =', multiplyResult);

    // 异步操作
    console.log('\n--- 异步操作 ---');
    const sleepResult = await manager.invoke('calculator', 'sleep', { duration: 500 });
    console.log('sleep(500ms) =', sleepResult);

    // 文本处理
    console.log('\n--- 文本处理 ---');
    const textResult = await manager.invoke('calculator', 'processText', {
      text: 'Hello World',
      operation: 'uppercase',
    });
    console.log('processText =', textResult);

    // 数据验证
    console.log('\n--- 数据验证 ---');
    const validateResult = await manager.invoke('calculator', 'validateData', {
      data: { name: 'Alice', age: 25 },
      schema: {
        required: ['name', 'age'],
        types: { name: 'string', age: 'number' },
      },
    });
    console.log('validateData =', validateResult);

    // 4. 并发调用
    console.log('\n4. 并发调用测试...');
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      manager.invoke('calculator', 'add', { a: i, b: i * 2 })
    );

    const concurrentResults = await Promise.all(concurrentRequests);
    console.log(`✓ 完成 ${concurrentResults.length} 个并发请求`);

    // 5. 错误处理
    console.log('\n5. 错误处理测试...');
    try {
      await manager.invoke('calculator', 'throwError', {});
    } catch (error) {
      console.log('✓ 成功捕获错误:', error.message);
    }

    // 6. 查看指标
    console.log('\n6. 查看监控指标...');
    const serviceMetrics = manager.getServiceMetrics('calculator');
    console.log('服务指标:', {
      pods: serviceMetrics.pods,
      queueLength: serviceMetrics.queueLength,
      totalRequests: serviceMetrics.totalRequests,
      errorRate: (serviceMetrics.errorRate * 100).toFixed(2) + '%',
    });

    const globalMetrics = manager.getGlobalMetrics();
    console.log('全局指标:', {
      totalServices: globalMetrics.totalServices,
      totalPods: globalMetrics.totalPods,
      totalRequests: globalMetrics.totalRequests,
      avgResponseTime: globalMetrics.avgResponseTime.toFixed(2) + 'ms',
    });

    // 7. 使用调用选项
    console.log('\n7. 使用调用选项...');
    const resultWithOptions = await manager.invoke(
      'calculator',
      'add',
      { a: 100, b: 200 },
      {
        timeout: 5000,
        traceId: 'trace-12345',
        priority: 10,
      }
    );
    console.log('带选项的调用结果:', resultWithOptions);

    // 8. 注册多个服务
    console.log('\n8. 注册多个服务...');
    await manager.registerService('processor', pluginPath, {
      minPods: 1,
      maxPods: 3,
      idleTimeout: 60000,
      podTimeout: 10000,
      maxRequestsPerPod: 50,
      maxQueueSize: 30,
    });

    const processorResult = await manager.invoke('processor', 'processText', {
      text: 'FastGPT Plugin Pool',
      operation: 'reverse',
    });
    console.log('processor 服务调用结果:', processorResult);

    // 9. 查看所有服务
    console.log('\n9. 查看所有服务...');
    const services = manager.getServiceNames();
    console.log('已注册的服务:', services);

    // 10. 注销服务
    console.log('\n10. 注销服务...');
    await manager.unregisterService('processor');
    console.log('✓ processor 服务已注销');
    console.log('剩余服务:', manager.getServiceNames());

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    // 11. 清理资源
    console.log('\n11. 清理资源...');
    await manager.destroy();
    console.log('✓ 管理器已销毁');
  }

  console.log('\n=== 示例完成 ===');
}

// 运行示例
main().catch(console.error);
