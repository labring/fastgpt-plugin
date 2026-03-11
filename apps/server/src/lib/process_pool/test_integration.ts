/**
 * 集成测试 - 测试 PluginServiceManager + FastGPTPlugin
 */

import { PluginServiceManager } from './plugin_service_manager';
import path from 'node:path';

async function runTests() {
  console.log('=== FastGPT Plugin Pool 集成测试 ===\n');

  const manager = new PluginServiceManager({
    maxTotalPods: 10,
  });

  try {
    // 测试 1: 注册服务
    console.log('📝 测试 1: 注册服务');
    const pluginPath = path.join(__dirname, 'example_plugin_v2.ts');

    await manager.registerService('calculator', pluginPath, {
      minPods: 2,
      maxPods: 5,
      idleTimeout: 60000,
      podTimeout: 10000,
      maxRequestsPerPod: 100,
      maxQueueSize: 50,
    });

    console.log('✅ 服务注册成功\n');

    // 等待 Pod 启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试 2: 基础运算
    console.log('📝 测试 2: 基础运算');
    const addResult = await manager.invoke('calculator', 'add', { a: 10, b: 20 });
    console.log('add(10, 20) =', addResult);
    console.assert(addResult.result === 30, '加法结果错误');

    const multiplyResult = await manager.invoke('calculator', 'multiply', { a: 5, b: 6 });
    console.log('multiply(5, 6) =', multiplyResult);
    console.assert(multiplyResult.result === 30, '乘法结果错误');
    console.log('✅ 基础运算测试通过\n');

    // 测试 3: 异步操作
    console.log('📝 测试 3: 异步操作');
    const sleepStart = Date.now();
    const sleepResult = await manager.invoke('calculator', 'sleep', { duration: 500 });
    const sleepDuration = Date.now() - sleepStart;
    console.log('sleep(500ms) =', sleepResult);
    console.assert(sleepDuration >= 500, '睡眠时间不足');
    console.log('✅ 异步操作测试通过\n');

    // 测试 4: 文本处理
    console.log('📝 测试 4: 文本处理');
    const textResult = await manager.invoke('calculator', 'processText', {
      text: 'Hello World',
      operation: 'uppercase',
    });
    console.log('processText =', textResult);
    console.assert(textResult.result === 'HELLO WORLD', '文本处理结果错误');
    console.log('✅ 文本处理测试通过\n');

    // 测试 5: 数据验证
    console.log('📝 测试 5: 数据验证');
    const validateResult = await manager.invoke('calculator', 'validateData', {
      data: { name: 'Alice', age: 25 },
      schema: {
        required: ['name', 'age'],
        types: { name: 'string', age: 'number' },
      },
    });
    console.log('validateData =', validateResult);
    console.assert(validateResult.valid === true, '验证结果错误');
    console.log('✅ 数据验证测试通过\n');

    // 测试 6: 并发调用
    console.log('📝 测试 6: 并发调用 (10个请求)');
    const concurrentStart = Date.now();
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      manager.invoke('calculator', 'add', { a: i, b: i * 2 })
    );
    const concurrentResults = await Promise.all(concurrentRequests);
    const concurrentDuration = Date.now() - concurrentStart;

    console.log(`完成 ${concurrentResults.length} 个并发请求，耗时 ${concurrentDuration}ms`);
    concurrentResults.forEach((result, i) => {
      console.assert(result.result === i + i * 2, `并发请求 ${i} 结果错误`);
    });
    console.log('✅ 并发调用测试通过\n');

    // 测试 7: 错误处理
    console.log('📝 测试 7: 错误处理');
    try {
      await manager.invoke('calculator', 'throwError', {});
      console.error('❌ 应该抛出错误');
    } catch (error: any) {
      console.log('捕获到错误:', error.message);
      console.assert(error.message.includes('测试错误'), '错误信息不正确');
      console.log('✅ 错误处理测试通过\n');
    }

    // 测试 8: 参数验证
    console.log('📝 测试 8: 参数验证');
    try {
      await manager.invoke('calculator', 'add', { a: 'not a number', b: 20 });
      console.error('❌ 应该抛出参数错误');
    } catch (error: any) {
      console.log('捕获到参数错误:', error.message);
      console.assert(error.message.includes('参数必须是数字'), '参数验证错误');
      console.log('✅ 参数验证测试通过\n');
    }

    // 测试 9: 查看指标
    console.log('📝 测试 9: 查看监控指标');
    const serviceMetrics = manager.getServiceMetrics('calculator');
    console.log('服务指标:', {
      pods: serviceMetrics.pods,
      queueLength: serviceMetrics.queueLength,
      totalRequests: serviceMetrics.totalRequests,
      errorRate: (serviceMetrics.errorRate * 100).toFixed(2) + '%',
    });

    console.assert(serviceMetrics.pods.total >= 2, 'Pod 数量不足');
    console.assert(serviceMetrics.totalRequests > 0, '请求数为 0');
    console.log('✅ 监控指标测试通过\n');

    const globalMetrics = manager.getGlobalMetrics();
    console.log('全局指标:', {
      totalServices: globalMetrics.totalServices,
      totalPods: globalMetrics.totalPods,
      totalRequests: globalMetrics.totalRequests,
      avgResponseTime: globalMetrics.avgResponseTime.toFixed(2) + 'ms',
    });

    console.assert(globalMetrics.totalServices === 1, '服务数量错误');
    console.log('✅ 全局指标测试通过\n');

    // 测试 10: 调用选项
    console.log('📝 测试 10: 调用选项 (timeout, traceId, priority)');
    const resultWithOptions = await manager.invoke(
      'calculator',
      'add',
      { a: 100, b: 200 },
      {
        timeout: 5000,
        traceId: 'test-trace-123',
        priority: 10,
      }
    );
    console.log('带选项的调用结果:', resultWithOptions);
    console.assert(resultWithOptions.result === 300, '结果错误');
    console.log('✅ 调用选项测试通过\n');

    // 测试 11: 超时测试
    console.log('📝 测试 11: 超时测试');
    try {
      await manager.invoke(
        'calculator',
        'sleep',
        { duration: 3000 },
        { timeout: 1000 }
      );
      console.error('❌ 应该超时');
    } catch (error: any) {
      console.log('捕获到超时错误:', error.message);
      console.assert(error.message.includes('超时'), '超时错误信息不正确');
      console.log('✅ 超时测试通过\n');
    }

    // 测试 12: 压力测试
    console.log('📝 测试 12: 压力测试 (50个请求)');
    const stressStart = Date.now();
    const stressRequests = Array.from({ length: 50 }, (_, i) =>
      manager.invoke('calculator', 'add', { a: i, b: 1 })
    );
    const stressResults = await Promise.all(stressRequests);
    const stressDuration = Date.now() - stressStart;

    console.log(`完成 ${stressResults.length} 个请求，耗时 ${stressDuration}ms`);
    console.log(`平均响应时间: ${(stressDuration / stressResults.length).toFixed(2)}ms`);
    console.log('✅ 压力测试通过\n');

    // 测试 13: 最终指标
    console.log('📝 测试 13: 最终指标检查');
    const finalMetrics = manager.getServiceMetrics('calculator');
    console.log('最终服务指标:', {
      totalRequests: finalMetrics.totalRequests,
      completedRequests: finalMetrics.totalRequests - (finalMetrics.totalRequests * finalMetrics.errorRate),
      errorRate: (finalMetrics.errorRate * 100).toFixed(2) + '%',
      avgResponseTime: finalMetrics.responseTime.avg.toFixed(2) + 'ms',
      p95ResponseTime: finalMetrics.responseTime.p95.toFixed(2) + 'ms',
    });
    console.log('✅ 最终指标检查通过\n');

    console.log('🎉 所有测试通过！\n');

    // 统计信息
    console.log('=== 测试统计 ===');
    console.log(`总请求数: ${finalMetrics.totalRequests}`);
    console.log(`成功率: ${((1 - finalMetrics.errorRate) * 100).toFixed(2)}%`);
    console.log(`平均响应时间: ${finalMetrics.responseTime.avg.toFixed(2)}ms`);
    console.log(`P95 响应时间: ${finalMetrics.responseTime.p95.toFixed(2)}ms`);
    console.log(`当前 Pod 数: ${finalMetrics.pods.total}`);
    console.log(`队列长度: ${finalMetrics.queueLength}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    // 清理
    console.log('\n🧹 清理资源...');
    await manager.destroy();
    console.log('✅ 资源清理完成');
  }
}

// 运行测试
runTests()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  });
