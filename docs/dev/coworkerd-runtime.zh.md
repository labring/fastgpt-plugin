# Coworkerd Runtime

## 当前接入范围

Coworkerd 作为 FastGPT Plugin server 的全局主 runtime，通过 `PLUGIN_RUNTIME_MODE=coworkerd` 显式选择；默认值仍为 `localPool`。当前 `CompositePluginRuntimeManager` 在宿主层选择单一 primary，并将 debug 请求优先发给 `ConnectionGatewayDebugRuntimeManager`。这不是逐插件自动分流；不要根据 `source` 推断 coworkerd tenant 或执行目标。

选择 Coworkerd 时需要配置以下环境变量：

- `COWORKERD_API_SERVER_URL`
- `COWORKERD_INGRESS_URL`
- `COWORKERD_MANAGEMENT_TOKEN`（只在 FastGPT server）
- `COWORKERD_COMPATIBILITY_DATE`（默认 `2026-01-01`）
- `COWORKERD_DEFAULT_CPU_MS` / `COWORKERD_DEFAULT_MEMORY_MIB`
- `COWORKERD_FALLBACK_TO_LOCAL_POOL`（可选，默认 `false`；设为 `true` 时启用 Coworkerd → LocalPool 兼容回退）
- `INTERNAL_PLUGIN_INVOKE_GATEWAY_URL` / `INTERNAL_PLUGIN_INVOKE_SECRET`

缺任一必要配置会使 env validation 失败；默认不会静默回退 LocalPool。设置 `PLUGIN_RUNTIME_MODE=localPool` 时不会构造 Coworkerd driver，也不依赖 coworkerd 配置；设置 `PLUGIN_RUNTIME_MODE=coworkerd` 且 `COWORKERD_FALLBACK_TO_LOCAL_POOL=false` 时不会构造 LocalPool driver。

每插件 runtime config 使用现有 `/plugin/runtime-config/get|set|reset` API，但 Coworkerd 配置要求 `{ tenantId, limits: { cpuMs, memoryMiB } }`，数据在 Mongo 中以 `coworkerd:<pluginId>` 独立命名，避免与 LocalPool 的 Pod 配置冲突。缺配置时默认 tenant 为 `system`。显式变更 tenant 当前被拒绝，需先进行独立迁移；reset 同样不会隐式迁移已部署 worker。该 API 接受严格的 LocalPool / Coworkerd config union，由当前全局 primary 解析和写入，不能用 Coworkerd 对象更新 LocalPool（反之亦然）。

## 上传与部署流程

复用现有 CLI `build` / `pack` 生成的 `.pkg`，无需新增 CLI Worker 构建目标或要求开发者随包提供源码。CLI 只负责本地构建和打包；`.pkg` 由用户或上层系统提交到 Plugin Server 的上传接口，不是 CLI 自动发布到 Coworkerd。

当前 CLI 构建会保留 `@fastgpt-plugin/sdk-factory` 的外部导入，因此包内 `index.js` 可以作为服务端二次构建的入口。重打包时将该导入解析为 Worker 兼容的 SDK 定义，并自动注入 HTTP Runtime Shim，替代 LocalPool 使用的 Node/IPC 绑定。此处复用的是 JavaScript 构建入口，并不表示现有 `index.js` 可以直接交给 Coworkerd 执行，也不保证任意 Node 依赖都能转换。

### 生命周期与失败语义

1. **upload：判断运行时并构建。** 由服务端选定的全局主运行时决定是否执行 Worker 构建；仅 `PLUGIN_RUNTIME_MODE=coworkerd` 执行。解包 `.pkg` 后，以其中的 `index.js` 为入口重打包，打包依赖、替换 SDK 并注入 Shim；拒绝当前 Web-only profile 不支持的 Node 内置模块（如 `child_process`、`fs`、`net`、`http2` 等）、原生扩展和残留外部导入；纯内存与编码模块（如 `buffer` / `node:buffer`）已由服务端自动注入轻量纯 JS Polyfill 并绑定 `globalThis.Buffer`。LocalPool 等其他模式沿用原上传流程，不要求通过 Worker 构建校验。
2. **构建成功：保存 pending 产物。** 将 Worker 代码和必要元数据保存到 Plugin Server 的私有文件存储，与原插件文件、pending 记录关联。这里的“上传产物”是保存到 Plugin Server 的存储，此时不调用 Coworkerd 部署 API。
3. **构建失败：该插件 upload 失败（默认）。** 返回明确的构建原因，清理本次临时文件和不再被引用的产物，不留下可确认的成功 pending 安装。现有批量上传支持部分成功：失败项进入 `failed`，其他成功项仍可返回。仅当显式开启 `COWORKERD_FALLBACK_TO_LOCAL_POOL=true` 时，才保留原始 `index.js` 完成上传，并在注册/调用时回退到 LocalPool。
4. **confirm → register：部署已有产物。** 读取已保存的 Worker 代码，根据实际 tenant、worker/version 标识和路由组装 Coworkerd v2 tar，发送给 Coworkerd 执行 Trial Load 和激活；此时通常不再重新编译插件。注册失败按现有确认回滚流程处理，向 confirm 返回部署错误；默认不自动回退 LocalPool（除非显式开启 `COWORKERD_FALLBACK_TO_LOCAL_POOL=true`）。
5. **JIT 补偿编译与存量平滑迁移。** 对于从 LocalPool 历史环境切换至 Coworkerd 的存量插件，由于其历史上传未生成 `worker/artifact.json`，在 `getWorkerArtifact` 时若发现缺少 Worker 产物但存有原始 `index.js`，且服务端当前启用了 Coworkerd `artifactBuilder`，PluginRepo 会自动基于存储中的 `index.js` 执行一次 JIT 补偿编译并回写持久化到存储中。若存量插件包含非 Web 标准 Node 依赖导致构建失败，服务端启动时的 active 预热注册将记录警告并跳过该插件，不阻断整个服务启动；后续实际调用该插件时由运行时透传结构化错误。
6. **未 confirm：过期清理。** pending 过期后，原插件文件与派生 Worker 产物一起纳入清理；清理必须保留仍被其他有效安装引用的共享文件，不能仅因一个 source 未确认就删除公共产物。

运行时判断由服务端依赖组装选择相应的产物处理器，upload 用例不读取环境变量，也不根据插件 `source` 推断运行时。构建门槛放在 `PluginRepo.createPlugin` 的共享入口，因此 URL 直接安装也会先构建，再注册部署。

### Worker 产物与部署包

upload 阶段将编译后的模块代码、SHA-256、格式版本 `fastgpt-worker-v1` 和编译时的反向网关 URL 一起保存为单个私有对象 `<pluginId>/<version>/<etag>/worker/artifact.json`，保持代码与元数据原子写入；confirm 阶段才生成部署相关清单及 tar，避免把 tenant、部署标识和路由提前固定在上传产物中。

当前网关 URL 编译进代码。读取产物时会校验内容哈希和网关 URL；同一插件身份的产物哈希保存在 Mongo，重复上传只接受一致产物，避免覆盖其他 source 正在使用的代码。修改 SDK 构建实现或网关 URL 后若产物改变，需要发布新的插件身份；注册不会在后台重编译或静默替换产物。

上传入口启用 `bundledInput` 检查：`index.js` 只能保留 SDK 主入口导入，其他依赖必须已被 CLI 打包；拒绝宿主路径、其他包和相对文件导入。一般源码构建仍可通过 `compileWorker` 处理本地依赖。

以下是职责示意，不是新增 `.pkg` 格式要求：

```text
CLI .pkg（保持现有格式）
  index.js + manifest.json + 静态资源
        ↓ Plugin Server upload，仅 Coworkerd 模式重打包
私有存储中的 pending Worker 产物
  worker/artifact.json（模块代码 + SHA-256 + 网关 URL + 格式版本）
        ↓ confirm → register，组装部署包
Coworkerd v2 tar
  manifest.json                         # Coworkerd 部署清单
  <workerId>/<versionId>/package.json    # 模块清单、字节数和 SHA-256
  <workerId>/<versionId>/worker.mjs       # 可执行模块
        ↓ Coworkerd Trial Load → 激活 → 路由传播
执行调用
```

`.pkg` 原有的 `manifest.json` 是插件业务清单；Coworkerd tar 顶层的 `manifest.json` 是部署清单，两者职责不同。不要求在 `.pkg` 中额外增加一份 Worker `manifest.json`。

### 校验边界与当前实现状态

upload 成功只表示 Worker 构建检查通过，不代表已通过 Coworkerd Trial Load，也不能证明全部运行分支兼容。Trial Load 发生在 confirm 注册期间，由 Coworkerd 加载产物；执行时仍可能遇到不支持的 API 或资源限制。激活后的路由传播是异步的，激活成功不代表每个节点立即就绪。

T9 已拆分 `compileWorker` 和 `packageWorkerBundle`，保留组合 API `buildWorkerBundle`。driver 的 register 只读取持久化代码并封装部署包，生产 resolver 已接通私有存储。服务端发行包从已有 `runtime-sdk` 目录动态加载独立构建器，避免 bundler 的相对模块路径被并入 `main.js` 后失效；`tsdown`、`tar-stream` 和 SDK 已列为服务端生产依赖。

本地集成测试与真实环境验收均已通过：
1. **本地测试**：使用实际构建后的 CLI `pack` 生成 `.pkg`，执行真实包解析、upload 构建、confirm 用例、tar 封装以及 JSON/NDJSON Worker 协议，确认注册和执行阶段不再次编译；Node 依赖插件在 upload 阶段失败。仓库测试另覆盖私有产物读写、仓库重建后读取、重复上传、共享引用保留、部分写入重试与清理认领。
2. **真实环境验收（`apps/server/src/routes/coworkerd-live-acceptance.test.ts`）**：在实际 `100.64.0.5` 集群与真实 MongoDB 上，验证了真实 CLI `pack` 打包、upload 保存 Worker 产物、confirm 触发远端 `node-1` Trial Load 与原子激活、通过数据面 Ingress `100.64.0.5:18080` 完成真实 V8 Isolate 内的普通 JSON 调用与 NDJSON 流式返回，以及之后的 Worker/版本注销与 MongoDB 记录清理。

### pending 与失败文件清理

Coworkerd 上传记录使用非 TTL 的 `uploadExpiresAt` 标记，默认 120 分钟；在确认成功后移除，注册失败回滚时恢复。先写 disabled 插件记录再写远程文件，使部分写入失败可被后续回收；`workerUploadIncomplete` 阻止确认不完整上传，重传时补齐文件。上传解包后的本地文件在持久化成功或失败后释放，构建临时目录由构建器清理。

Coworkerd 模式的服务端启动后及每分钟执行一次过期上传回收。回收检查所有 source 的有效 pending/active 引用，原子认领过期且无引用的记录，再删除整个插件存储前缀（包含 Worker 派生产物），最后删除安装关系和实体。上传续期与确认会阻止过期认领；已认领的记录拒绝重新上传，清理失败后保留记录，由五分钟租约到期后的回收重试。显式 prune 在 Coworkerd 模式也遵守认领规则。

## 错误分类、监控指标与集群熔断（T8）

### 错误分类映射

Ingress 与 API 调用中的错误经 `error-handler.ts` 转换为领域 `RegisteredError`，区分应用层/配额错误与底层集群传输故障：

- **503 + CPU_LIMIT_EXCEEDED**：映射为 `plugin.invoke.cpu_limit_exceeded`（HTTP 504，超时超限），禁止重试，不计入集群熔断计数。
- **503 + MEMORY_LIMIT_EXCEEDED**：映射为 `plugin.invoke.memory_limit_exceeded`（HTTP 503，内存超限），禁止重试，不计入集群熔断计数。
- **422 + LOAD_FAILED**：映射为 `plugin.runtime.trial_load_failed`（试加载语法/链接失败）。
- **404 + ROUTE_NOT_FOUND**：映射为 `plugin.runtime.plugin_not_found`。
- **405 + METHOD_NOT_ALLOWED**：映射为 `plugin.runtime.event_not_supported`。
- **500 + EXECUTION_FAILED**：映射为 `plugin.invoke.failed`（插件 handler 自身抛错），不计入集群熔断计数。
- **502 / 504 / 无配额码的 503 / 网络不可达**：映射为 `plugin.runtime.cluster_unavailable`，属于集群级传输失败，计入断路器失败统计。

### 断路器与健康检查（Circuit Breaker & Health Checker）

- **断路器（`CircuitBreaker`）**：默认在连续 5 次集群传输故障后从 `closed` 状态熔断到 `open` 状态。在 `open` 状态下，所有调用直接快速失败返回 `plugin.runtime.cluster_unavailable`，不产生网络开销。经过冷却时间（默认 15 秒）后自动进入 `half_open` 状态，允许 1 次探测调用，探测成功立即重置为 `closed`，失败则重新退回 `open`。
- **健康探测器（`HealthChecker`）**：定期调用 `/v1/status` 检查集群可用节点。当集群没有可用/存活节点时，向断路器记入失败；当节点恢复且可达节点大于 0 时，重置断路器状态。Driver 状态接口返回当前断路器与可达节点信息。

### 调用度量指标

`CoworkerdPluginRuntimeDriver` 接入 `RuntimeMetricsRecorder`（OpenTelemetry）：
- 调用开始：增加 `fastgpt.plugin.runtime.invocations.started` 计数（`runtime.mode: coworkerd`）。
- 调用完成：直方图 `fastgpt.plugin.runtime.invocation.duration` 记录耗时毫秒数（普通与流式均记录完整耗时）。
- 调用失败：增加 `fastgpt.plugin.runtime.invocations.failed` 计数，并附带明确的 `failure.kind` 属性（如 `cpu_limit_exceeded`、`memory_limit_exceeded`、`trial_load_failed`、`circuit_breaker_open` 等）。
- 兼容回退：增加 `fastgpt.plugin.runtime.fallbacks` 计数，附带 `fallback.target_runtime`、`fallback.reason`（`artifact_build_failed | trial_load_failed | circuit_breaker_open | cluster_unavailable`）、`fallback.phase`（`register | invoke`）与 `fallback.sticky`。

## LocalPool 兼容回退策略（`COWORKERD_FALLBACK_TO_LOCAL_POOL`）

为便于验证存量及私有化插件在 Coworkerd 中的兼容性，支持通过环境变量 `COWORKERD_FALLBACK_TO_LOCAL_POOL=true`（默认 `false`）开启 Coworkerd → LocalPool 自动回退。开启后 `apps/server/src/deps.ts` 会使用 `CoworkerdFallbackRuntimeDriver` 包装 Coworkerd 与 LocalPool，并向 `PluginRepo` 传入 `allowArtifactBuildFallback: true`：

- **上传阶段**：当工具插件在 Worker 打包阶段因静态不兼容（`plugin.runtime.artifact_build_failed`，如引用 `node:fs`、`node:child_process` 等）构建失败时，记录 `warn` 日志并跳过 `worker/artifact.json`，保留原始 `index.js` 完成上传与安装；关闭开关时保持原严格失败语义。
- **静态不兼容（Sticky 内存回退）**：在 `register` 或 `invoke` 遇到 `plugin.runtime.artifact_build_failed` 或 `plugin.runtime.trial_load_failed`（HTTP 422 / `LOAD_FAILED`）时，将该不可变插件标识（`pluginId@version@etag`）记入进程内存粘性回退表，首次进入记 `warn`、后续命中记 `debug`，自动在 LocalPool 中按需注册（带并发 singleflight 保护）并执行；`unregister` 或服务重启后状态自动清空，重新验证兼容性。
- **集群不可用（Transient 单次临时回退）**：遇到断路器熔断（`circuit_breaker_open`）或集群网络/网关故障（502 / 网关 504 / 无配额码 503 / 传播超时）时，仅对本次请求临时回退到 LocalPool，不写入粘性表；待 Coworkerd 集群恢复或断路器关闭后，后续请求自动切回 Coworkerd（由 `CoworkerdPluginRuntimeDriver.invoke()` 按需自动注册部署）。
- **明确不回退的场景**：CPU 超限（`plugin.invoke.cpu_limit_exceeded`）、内存超限（`plugin.invoke.memory_limit_exceeded`）、调用超时（`plugin.invoke.timeout`）、插件业务异常（`plugin.invoke.failed`）、不支持的事件及流式响应已开始后的 mid-stream 异常，绝不回退到 LocalPool。
- **状态可观测性**：`status()` 与 `globalStatus()` 在保留原有 Coworkerd 字段的基础上增量返回 `activeRuntime` 与 `fallback` 摘要（含粘性插件列表、临时回退计数与 LocalPool 指标）。

## 集群网络要求与验证

在测试集群验证过 coworkerd 0.5.2 的 Trial Load、JSON/NDJSON Ingress、激活传播、Worker/版本移除；临时 tenant 已清理。反向调用请求曾抵达 Worker，但 Coworkerd node 返回 `EGRESS_DENIED: private-network`，网关零请求。

上线前由 cluster operator 按 Coworkerd 的 `egress.tenants` 为目标 tenant 配置精确的宿主网关 hostname/port allow rule，并配置 FastGPT gateway TLS 信任；不要全局放行 RFC1918 私网，也不要开放管理面端口。随后设置 `COWORKERD_SMOKE_GATEWAY_HOST` 运行 opt-in `apps/server/src/routes/coworkerd-runtime.smoke.test.ts`，确认实际 Worker → gateway HTTP 请求成功，再重新验收。

生产 driver 选择、schema、mode 优先级、config DTO、T9 上传构建/产物读取、JIT 补偿编译与可选的 `COWORKERD_FALLBACK_TO_LOCAL_POOL` 回退策略均已接入。默认关闭回退开关时，缺少 Worker 产物且 JIT 编译失败的旧插件不会静默回退到 LocalPool；开启 `COWORKERD_FALLBACK_TO_LOCAL_POOL=true` 后会自动按上述策略回退。新生命周期仍需真实 Mongo/S3/Coworkerd 联调，真实反向调用还需要完成 Egress 配置与联调。
