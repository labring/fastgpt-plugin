# FastGPT Plugin Pool 技术方案

> 一个**可嵌入现有服务的插件进程池库**，以 TypeScript Library 形式提供。
> 设计参考 K8s 的命名与抽象：不同 plugin 之间互相隔离（各自队列/池），OS 上实际运行的是 Pod。

---

## 1. 背景与目标

### 设计理念

- 进程池能力以 TypeScript Library 的形式嵌入到现有服务中
- 宿主服务直接调用：`manager.invoke(serviceName, method, params)`
- 不提供独立服务或 HTTP API，由宿主服务决定如何暴露

### 核心目标

- **低延迟**：预热/复用避免冷启动
- **隔离性**：每个 plugin 独立管理 Pod 池与队列
- **可靠性**：超时 kill、崩溃自动补充、队列保护
- **可观测性**：每个 Service 与全局 metrics
- **全局资源控制**：跨 plugin 的总 Pod 数配额（避免打爆宿主机器）

---

## 2. 核心概念（K8s 风格命名）

### 2.1 PluginPod（对应 K8s Pod）

- OS 上的一个子进程（通过 child_process fork/spawn 创建）
- 一个时刻只处理一个请求（后续可扩展并发模型）
- 生命周期：pending → running → terminating/failed

### 2.2 PluginService（对应 K8s Service）

- 一个 plugin 对应一个 Service
- Service 是一组 Pod 的逻辑抽象
- 每个 Service 维护自己独立的：Pod 池 + 任务队列 + 配置 + 指标
- 负责扩缩容、健康检查、超时处理、队列保护

### 2.3 PluginServiceManager（全局管理器）

- 宿主服务进程内的单例/全局实例
- 管理所有 PluginService
- 提供：注册/注销、invoke 路由、全局 Pod 配额、全局 metrics、事件分发

---

## 3. 总体架构

```
Host Service（业务服务）
  ↓ direct call
PluginServiceManager（全局管理器）
  ↓
PluginService(weather)   → queue(weather)   → PluginPod × M
PluginService(translate) → queue(translate) → PluginPod × N
...
```

### 架构特点

- 每个 plugin 独立队列与池（互不影响）
- manager 统一做跨插件总量配额控制
- 宿主服务通过 manager 直接调用，无需网络开销

---

## 4. 调度与生命周期

### 4.1 invoke 调度流程

1. `manager.invoke(serviceName, method, params)`
2. 路由到对应 `PluginService.invoke()`
3. **acquirePod**：优先找空闲 Pod；不足则创建；到上限则排队等待（带超时）
4. **Pod 执行**：IPC request/response
5. **releasePod**：释放 busy；必要时重启 Pod；唤醒队列

### 4.2 扩缩容策略

- **扩容**：无空闲 Pod 且 pods < maxPods 且全局配额允许 → create
- **缩容**：Pod 空闲超过 idleTimeout 且 pods > minPods → destroy
- **保底**：启动时预热 minPods

### 4.3 故障处理

- **执行超时**：podTimeout 到期仍 busy → kill 并补充
- **进程崩溃**：exit/error → 标记 failed、释放配额、若低于 minPods 自动补
- **队列保护**：maxQueueSize 限制；队列等待超时避免永久阻塞

---

## 5. 通信协议

### IPC 通信

使用 Node.js IPC（fork 启动子进程，使用 IPC channel 传递 JSON 消息）。

### 消息结构

```ts
type PluginMessageType = 'request' | 'response' | 'event' | 'callback'

interface PluginMessage {
  version: string
  id: string
  type: PluginMessageType
  method?: string
  params?: any
  result?: any
  error?: { code: string; message: string; stack?: string }
  timestamp?: number
  traceId?: string
}
```

### Ready 信号

插件启动完成后发送 `{ type: 'ready' }`，宿主将 Pod 从 pending 标记为 running。

---

## 6. 配置建议

### Service 配置（按 plugin 单独配置）

| 参数 | 建议范围 | 说明 |
|------|---------|------|
| minPods | 1~2 | 低延迟诉求高则 2 |
| maxPods | 5~20 | 视 CPU/内存 |
| podTimeout | 10s~60s | 按插件特性 |
| maxConcurrentRequestsPerPod | 1~10 | 按插件 CPU/IO 特性 |

### 全局配置

- **maxTotalPods**：必须设置（避免多插件总和把宿主机器打爆）
- **idleTimeout**：Pod 空闲超时
- **maxRequestsPerPod**：防泄漏/碎片化
- **maxQueueSize**：按 QPS 与可接受延迟
- **queueTimeout**：队列等待超时
- **startupRetryBaseDelay**：启动超时退避基础时间，对应 `POOL_SERVICE_STARTUP_RETRY_BASE_DELAY`
- **startupRetryMaxDelay**：启动超时退避最大时间，对应 `POOL_SERVICE_STARTUP_RETRY_MAX_DELAY`

---

## 7. 监控指标

### Service 维度（每个 plugin）

- **pods**：total/running/busy/idle
- **queueLength**：当前队列长度
- **responseTime**：avg / p95
- **rps**：每秒请求数
- **errorRate**：错误率
- **crashCount**：崩溃次数

### Global 维度

- **totalServices**：注册的服务总数
- **totalPods**：当前占用配额
- **totalRequests**：总请求数
- **avgResponseTime**：平均响应时间
- **errorRate**：全局错误率

---

## 8. 对外 API

### 核心接口

```ts
class PluginServiceManager {
  constructor(globalConfig: { maxTotalPods: number }) {}

  // 注册/注销服务
  registerService(name: string, pluginPath: string, config: ServiceConfig): Promise<void>
  unregisterService(name: string): Promise<void>

  // 调用插件
  invoke(serviceName: string, method: string, params: any): Promise<any>

  // 获取指标
  getServiceMetrics(serviceName: string): ServiceMetrics
  getGlobalMetrics(): GlobalMetrics
}
```

### 使用说明

- 不提供 HTTP API，宿主服务自行决定暴露什么接口
- 通过直接调用 manager 实例来使用进程池能力
- 宿主服务负责管理 plugin 注册（配置文件/数据库/启动时加载）

---

## 9. 集成说明

### 宿主服务需要做的事

1. **初始化管理器**
   ```ts
   const manager = new PluginServiceManager({ maxTotalPods: 50 })
   ```

2. **注册插件**
   - 从配置文件/数据库加载插件信息
   - 调用 `manager.registerService()` 注册

3. **调用插件**
   - 业务代码直接调用 `manager.invoke()`
   - 自行实现鉴权、限流、审计等

4. **监控与运维**
   - 定期获取 metrics
   - 根据需要暴露监控接口

### 核心能力

保留并封装在库中：
- 进程池调度逻辑
- IPC 协议
- metrics 统计
- 故障恢复
- 资源配额管理
