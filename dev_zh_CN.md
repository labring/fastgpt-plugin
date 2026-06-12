# FastGPT Plugin 开发文档

语言：[简体中文](./dev_zh_CN.md) | [English](./dev.md)

## 常用命令

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
pnpm build:sdk-factory
pnpm build:sdk-client
pnpm build:cli
pnpm build:server
pnpm build:debug-runtime-monitor
```

### 开发

```bash
pnpm dev:server
pnpm dev:cli
pnpm dev:debug-runtime-monitor
```

### 质量检查

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## 仓库结构

当前仓库是 pnpm workspace monorepo。

| 路径 | 作用 |
| --- | --- |
| `apps/server` | FastGPT Plugin HTTP 服务和路由组装。 |
| `apps/cli` | 插件创建、构建、检查、调试和打包 CLI。 |
| `apps/debug-runtime-monitor` | 本地运行时和 Connection Gateway 指标监控 UI。 |
| `packages/domain` | 实体、值对象和端口定义。 |
| `packages/usecase` | 插件、工具、模型和运行时指标用例。 |
| `packages/interface-adapter` | HTTP contract、DTO 和鉴权适配。 |
| `packages/infrastructure` | Hono、Mongo、S3、Redis、静态数据、日志、指标和插件运行时实现。 |
| `packages/shared` | 跨层复用的纯工具函数。 |
| `sdk/client` | 调用 FastGPT Plugin 服务的客户端 SDK。 |
| `sdk/factory` | 编写工具插件的 SDK。 |
| `test` | 共享 fixtures 和跨包测试工具。 |

完整分层说明见 [项目架构](./docs/dev/architecture.zh.md)。

## 插件开发

工具插件使用 `@fastgpt-plugin/cli` 和 `@fastgpt-plugin/sdk-factory` 开发。

```bash
pnpx @fastgpt-plugin/cli create my-tool --type tool --cwd packages/tools
pnpx @fastgpt-plugin/cli create my-tool-suite --type tool-suite --cwd packages/tools
```

在插件项目中通常运行：

```bash
pnpm run test
pnpm run build
pnpx @fastgpt-plugin/cli check --entry . --output ./dist
pnpm run pack
```

参考文档：

- [系统插件开发指南](./docs/dev/how-to-devlop-plugin.md)
- [SDK Factory 使用指南](./sdk/factory/README.md)
- [CLI 使用指南](./apps/cli/README.md)

## 开发习惯

### 1. 使用英文标识符

变量、函数、文件和公开 API 名称使用英文。历史兼容所需的非英文标识符可以保留。

### 2. 保持层级边界清晰

遵循现有依赖方向：

1. 在 `packages/domain` 定义稳定业务类型和端口。
2. 在 `packages/usecase` 实现业务编排。
3. 在 `packages/interface-adapter` 定义 DTO 和 OpenAPI contract。
4. 在 `packages/infrastructure` 实现框架、存储、运行时和外部服务细节。
5. 在 `apps/server/src/deps.ts` 和路由文件中装配具体依赖。

### 3. 编写测试

测试使用 [Vitest](https://vitest.dev)。优先把测试放在被测代码附近：

- usecase 测试使用 mock port。
- infrastructure 测试隔离外部 IO，覆盖序列化、错误映射和安全约束。
- CLI 修改覆盖命令行为和生成产物。
- SDK 修改覆盖面向 TypeScript 的 API 行为和运行时通道行为。

### 4. 优先使用 `const`

默认使用 `const`。只有变量需要重新赋值时使用 `let`。

### 5. 避免 `any`

优先使用明确类型、Zod schema 和领域值对象。在边界处使用 `unknown`，解析后再进入业务逻辑。

### 6. 控制作用域

变量和 helper 尽量靠近使用位置。只有当 helper 能表达业务意图或消除有意义的重复时再抽取。

## 模型预设

模型供应商预设现在位于 `packages/infrastructure/src/static-data/models/provider`。

新增或更新模型供应商时：

1. 更新或新增 `packages/infrastructure/src/static-data/models/provider/<Provider>/index.ts`。
2. 需要时更新同目录的 provider logo。
3. 需要时在 `packages/infrastructure/src/static-data/models/channel-avatar` 添加 channel avatar。
4. 新 provider 需要在 `packages/infrastructure/src/static-data/models/index.ts` 注册。
5. 运行受影响包的测试或 typecheck。

## 运行时与运维

- local-pool 运行时设计：[process-pool-design.zh.md](./docs/dev/process-pool-design.zh.md)
- Runtime metrics 与 OpenTelemetry：[runtime-metrics-otel.zh.md](./docs/dev/runtime-metrics-otel.zh.md)
- 升级说明：[v1.0.0.zh.md](./docs/upgrade/v1.0.0.zh.md)
