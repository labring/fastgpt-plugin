# FastGPT Plugin Pool

一个可嵌入现有服务的插件进程池库，设计参考 K8s 的命名与抽象。

## 快速开始

### 1. 基本使用

```typescript
import { PluginServiceManager } from './process_pool';

// 创建管理器
const manager = new PluginServiceManager({
  maxTotalPods: 50, // 全局最大 Pod 数
});

// 注册插件服务
await manager.registerService('weather', '/path/to/weather-plugin.js', {
  minPods: 2,
  maxPods: 10,
  podTimeout: 30000,
  maxConcurrentRequestsPerPod: 10,
});

// 调用插件
const result = await manager.invoke('weather', 'getTemperature', {
  city: 'Beijing',
});

console.log(result); // { city: 'Beijing', temperature: 25, unit: 'C' }

// 获取指标
const metrics = manager.getServiceMetrics('weather');
console.log(metrics.pods.total); // 当前 Pod 数量

// 销毁管理器
await manager.destroy();
```

### 2. 编写插件

插件是一个独立的 TypeScript/JavaScript 文件，通过 IPC 与主进程通信：

```typescript
// my-plugin.ts
import type { PluginMessage } from './types';

// 1. 发送 ready 信号
process.send?.({
  version: '1.0',
  id: 'ready',
  type: 'ready',
  timestamp: Date.now(),
});

// 2. 监听请求
process.on('message', async (message: PluginMessage) => {
  if (message.type !== 'request') return;

  try {
    // 执行业务逻辑
    const result = await handleMethod(message.method, message.params);

    // 发送响应
    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      result,
      timestamp: Date.now(),
      traceId: message.traceId,
    });
  } catch (error: any) {
    // 发送错误响应
    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      error: {
        code: 'PLUGIN_ERROR',
        message: error.message,
        stack: error.stack,
      },
      timestamp: Date.now(),
      traceId: message.traceId,
    });
  }
});

async function handleMethod(method: string, params: any) {
  switch (method) {
    case 'myMethod':
      return { success: true, data: params };
    default:
      throw new Error(`未知方法: ${method}`);
  }
}
```

## 核心概念

### PluginServiceManager

全局管理器，管理所有插件服务：

- 注册/注销服务
- 路由请求到对应服务
- 全局配额控制
- 全局监控指标

### PluginService

单个插件的进程池管理：

- 独立的 Pod 池和队列
- 自动扩缩容
- 故障恢复
- 服务级别监控

### PluginPod

单个工作进程：

- IPC 通信
- 生命周期管理
- 超时控制
- 请求计数

## 配置说明

### 全局配置

```typescript
interface GlobalConfig {
  maxTotalPods: number;        // 全局最大 Pod 总数（必须）
  healthCheckInterval?: number; // 健康检查间隔（毫秒，默认 30000）
  idleTimeout: number;         // 全局 Pod 空闲超时（毫秒）
  maxRequestsPerPod: number;   // 全局单个 Pod 最大请求数
  maxQueueSize: number;        // 全局最大队列长度
  queueTimeout: number;        // 全局队列等待超时（毫秒）
}
```

### 插件级服务配置

```typescript
interface ServiceConfig {
  minPods: number;            // 最小 Pod 数量
  maxPods: number;            // 最大 Pod 数量
  podTimeout: number;         // Pod 执行超时（毫秒）
  maxConcurrentRequestsPerPod: number; // 单个 Pod 最大并发请求数
}
```

### 推荐配置

| 参数 | 建议范围 | 说明 |
|------|---------|------|
| minPods | 1~2 | 低延迟诉求高则 2 |
| maxPods | 5~20 | 视 CPU/内存 |
| podTimeout | 10s~60s | 按插件特性 |
| maxConcurrentRequestsPerPod | 1~10 | 按插件 CPU/IO 特性 |

## 监控指标

### 服务级别指标

```typescript
const metrics = manager.getServiceMetrics('weather');

console.log(metrics);
// {
//   pods: { total: 5, running: 5, busy: 2, idle: 3 },
//   queueLength: 10,
//   responseTime: { avg: 150, p95: 300 },
//   rps: 100,
//   errorRate: 0.01,
//   crashCount: 2,
//   totalRequests: 10000
// }
```

### 全局指标

```typescript
const globalMetrics = manager.getGlobalMetrics();

console.log(globalMetrics);
// {
//   totalServices: 3,
//   totalPods: 15,
//   totalRequests: 50000,
//   avgResponseTime: 200,
//   errorRate: 0.02
// }
```

## 事件系统

### PluginService 事件

```typescript
service.on('podReady', (info) => {
  console.log('Pod 就绪:', info.podId);
});

service.on('podCreated', (info) => {
  console.log('Pod 创建:', info.podId);
});

service.on('podDestroyed', (info) => {
  console.log('Pod 销毁:', info.podId);
});

service.on('podCrashed', (info, error) => {
  console.error('Pod 崩溃:', info.podId, error);
});

service.on('requestQueued', (requestId) => {
  console.log('请求排队:', requestId);
});

service.on('requestCompleted', ({ requestId, duration }) => {
  console.log('请求完成:', requestId, duration);
});

service.on('requestFailed', ({ requestId, error }) => {
  console.error('请求失败:', requestId, error);
});
```

### PluginServiceManager 事件

```typescript
manager.on('serviceRegistered', ({ serviceName }) => {
  console.log('服务注册:', serviceName);
});

manager.on('serviceUnregistered', ({ serviceName }) => {
  console.log('服务注销:', serviceName);
});

manager.on('serviceUnhealthy', ({ serviceName, reason }) => {
  console.warn('服务不健康:', serviceName, reason);
});

manager.on('quotaExceeded', ({ requested, available }) => {
  console.warn('配额超限:', requested, available);
});

manager.on('healthCheck', ({ timestamp, services }) => {
  console.log('健康检查:', services);
});
```

## 高级用法

### 调用选项

```typescript
// 自定义超时
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  timeout: 5000,
});

// 追踪 ID
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  traceId: 'trace-123',
});

// 优先级（数字越大优先级越高）
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  priority: 10,
});
```

### 动态配置更新

```typescript
// 更新服务配置
await manager.updateServiceConfig('weather', {
  minPods: 3,
  maxPods: 15,
  podTimeout: 30000,
  maxConcurrentRequestsPerPod: 10,
});
```

### 优雅关闭

```typescript
// 等待所有请求完成
await manager.destroy();

// 强制关闭（超时后强制）
await manager.destroy({
  force: false,
  timeout: 10000,
});

// 立即强制关闭
await manager.destroy({
  force: true,
});
```

## 测试

运行测试：

```bash
bun run test
```

测试文件：
- `plugin_service.test.ts` - 单插件进程池管理测试
- `plugin_service_manager.test.ts` - 多插件管理测试

## 架构

```
Host Service（业务服务）
  ↓ direct call
PluginServiceManager（全局管理器）
  ↓
PluginService(weather)   → queue(weather)   → PluginPod × M
PluginService(translate) → queue(translate) → PluginPod × N
...
```

### 关键特性

- **插件隔离**：每个插件独立队列与池（互不影响）
- **全局配额**：manager 统一做跨插件总量配额控制
- **低延迟**：预热/复用避免冷启动
- **可靠性**：超时 kill、崩溃自动补充、队列保护
- **可观测性**：每个 Service 与全局 metrics

## 故障处理

### 执行超时

podTimeout 到期仍 busy → kill 并补充

### 进程崩溃

exit/error → 标记 failed、释放配额、若低于 minPods 自动补

### 队列保护

maxQueueSize 限制；队列等待超时避免永久阻塞

## 最佳实践

1. **合理设置 minPods**：根据预期负载设置，避免冷启动
2. **控制 maxRequestsPerPod**：防止内存泄漏和碎片化
3. **监控指标**：定期检查 errorRate 和 crashCount
4. **全局配额**：确保 maxTotalPods 不会打爆宿主机器
5. **优雅关闭**：生产环境使用优雅关闭，避免请求丢失

## 许可证

MIT
