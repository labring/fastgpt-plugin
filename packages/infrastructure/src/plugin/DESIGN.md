# FastGPT Plugin Manager 设计方案

## 需求

1. 支持不同环境下的插件运行:
  1. IPC-based 本地进程池
  2. Serverless 服务
  3. WSS 调试长连接
2. 支持不同类型的插件，包括 tool, model, dataset, workflow 等

## 设计

1. PluginRepo 仓储，调用 s3, mongo 等依赖管理插件等的持久化状态
2. PluginRuntimeManager，管理插件运行时的生命周期, 以及调用入口
3. InvokeManager 反向调用管理器，反向调用逻辑

### Clean Architecture 分层边界

项目按 Clean Architecture 和 DDD 组织依赖方向：

1. `packages/domain` 定义实体、值对象和 Port，是插件系统的核心抽象层
2. `packages/usecase` 编排业务用例，依赖 domain 抽象
3. `packages/infrastructure` 实现外部系统 adapter，包括存储、Mongo、OSS、插件运行时 driver、FC SDK 等
4. `apps/*` 是组合根，负责读取环境变量、实例化具体 adapter、把实现注入 usecase 或 server
5. `sdk/*` 是插件侧或外部消费的 SDK，不作为业务组合根

依赖方向必须保持向内：

```text
apps/* -> usecase / infrastructure -> domain
sdk/*  -> domain-facing types or generated public API
```

`packages/infrastructure` 不能依赖 `apps/*`。`apps/*` 可以选择 infrastructure 的具体实现，但 infrastructure 内部的 driver、runtime 协议和 provider 不能反向 import 组合根代码。这样可以保证插件 runtime driver 能在 CLI、server、测试或其他宿主中复用。

### Runtime 组合根职责

`apps/server` 只负责组合：

1. 根据 `PLUGIN_RUNTIME_MODE` 选择 runtime manager
2. 组装 `PluginRepo`、`PluginRuntimeConfigRepo`、OSS storage、FC provider 等依赖
3. 导出 `ToolManager` 需要的 `PluginRuntimeManagerPort` 实现

具体 driver 的生命周期和协议归属 infrastructure：

```text
packages/infrastructure/src/plugin/plugin-runtime/drivers/
  local-pool/
    local-pool-runtime.driver.ts
    pod/
    service/
  serverless/FC/
    fc.plugin-runtime.driver.ts
    fc-function-registry.ts
    fc-function-invoker.ts
    fc-runtime-artifact.repo.ts
    runtime/
      src/bootstrap.ts
      src/plugin-loader.ts
      src/handler.ts
      Dockerfile
```

`serverless/FC/runtime` 虽然最终会被打包成独立 container image，但逻辑上属于 FC driver 的运行侧 adapter，不属于 `apps/*` 组合根。它和 `fc.plugin-runtime.driver.ts` 共享协议、签名、frame 类型和 artifact 加载约定，因此应与 FC driver 放在同一 infrastructure 边界内。

### FC Runtime Image 归属

FC runtime image 是通用插件执行器：

1. 冷启动时读取函数环境变量中的 `PLUGIN_ID / PLUGIN_VERSION / PLUGIN_ETAG / PLUGIN_ARTIFACT_*`
2. 从 FC artifact OSS 下载 active `index.js`
3. 动态 import 插件 factory
4. 执行 tool handler
5. 通过 NDJSON frame 返回 `stream / response / error`
6. 通过 `InvokeManager` 支持 `ctx.invoke.userInfo()` 和 `ctx.invoke.uploadFile()`

它的源码和 Dockerfile 放在：

```text
packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/
```

构建入口由 infrastructure 暴露：

```bash
pnpm run build:fc-runtime
pnpm run docker:fc-runtime
```

根脚本可以转发这些命令，但不能把 runtime 源码放回 `apps/*`，否则会形成 infrastructure driver 依赖组合根实现的架构倒置。

### 不同类型的插件的管理

1. ToolManager 工具管理，依赖同一个 PluginRuntimeManager
2. ModelManager, 管理模型
3. DatasetSourceManager, 管理知识库信息源
4. WorkflowManager, 应用模版

### Plugin Runtime Drivers

对于不同的运行时的实现，implement 同一个 Port

1. LocalPoolDriver 本地进程池驱动
2. ConnectionGatewayDebugDriver WSS 调试驱动
3. FCDriver 阿里云 FC 驱动
4. LambdaDriver AWS Lambda 驱动 (TODO)

所有 driver 都实现 domain 层的 `PluginRuntimeManagerPort`。上层 ToolManager 只依赖 Port，不关心运行时是 local-pool、FC、TCP 还是其他 provider。

FC driver 的内部拆分：

1. `FCPluginRuntimeManager`：实现 `PluginRuntimeManagerPort`，负责 register、unregister、invoke、status、metrics
2. `FCRuntimeArtifactRepo`：把 PluginRepo active `index.js` 发布到 FC 专用 OSS
3. `FCFunctionRegistry`：幂等 create/update/delete FC function
4. `FCFunctionInvoker`：执行函数调用，解析或重放 NDJSON frame
5. `FCFunctionProvider`：隔离 Aliyun FC SDK、HTTP provider 和测试用 in-memory provider
6. `runtime/`：运行在 FC 函数里的通用插件执行器

### Invoke 反向调用
