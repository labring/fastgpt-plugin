## @fastgpt-plugin/cli

语言：[简体中文](./README.md) | [English](./README.en.md)

FastGPT 插件开发的命令行工具，用于创建、构建和测试 FastGPT 工具 / 工具集。

### Features

- **统一构建流程**
  - 基于 `tsdown`，一键将 TypeScript 源码构建为 Node 22 兼容的 `dist` 产物
  - 自动生成 d.ts 类型声明，方便在其他包中引用
- **工具/工具集专用构建**
  - 支持以工具目录为入口（包含 `config.ts`、`index.ts` 等）
  - 在临时目录中对 `config.ts` 做 AST 转换，自动注入必要的 `toolId`、版本等元信息
  - 递归复制源码目录，自动跳过 `node_modules`、`dist`、`.build-*` 等目录
- **安全的构建行为**
  - 不在构建过程中调用 `process.exit`，错误以异常抛出，方便在上层脚本中统一处理
  - 自动创建临时构建目录并在构建结束后进行清理
- **测试友好**
  - 内置 Vitest 配置，支持对构建逻辑进行单元测试
  - 在测试环境下跳过对部分依赖的打包，构建更快更稳定
- **插件脚手架**
  - 提供 `create` 命令生成单工具或工具集项目
  - 模板包含 `index.ts`、`package.json`、`tsconfig.json`、`vitest.config.ts`、`README.md` 和 `logo.svg`
- **本地调试**
  - 提供 `debug` 命令查看插件和子工具信息
  - 支持直接运行工具、传入 input/secrets/systemVar 文件，并用本地目录模拟 `uploadFile`
  - 支持通过 Connection Gateway 建立一个 TCP 远程调试通道，并在一个通道内挂载多个本地插件
- **打包**
  - 提供 `pack` 命令把 `dist` 产物打成可上传的 `.pkg`

### 远程调试

本地插件可以通过 FastGPT 生成的 connect link 接入测试环境的 plugin-server。推荐路径是由 FastGPT 完成用户鉴权并创建 debug session，CLI 只使用一次性 ticket 换取短期连接信息。

```bash
fastgpt-plugin debug ./plugins/getTime ./plugins/dbops \
  --connect "https://fastgpt.example.com/debug-plugin/connect?ticket=..."
```

connect link 会返回 gateway TCP 地址、`debug:tmbId:{tmbId}:session:{debugSessionId}` source、预创建 session 和 scoped connect token。CLI 不需要 `CONNECTION_GATEWAY_AUTH_TOKEN` 或 `JWT_SECRET`。

本地底层联调仍可直接连接 Connection Gateway：

```bash
fastgpt-plugin debug ./plugins/getTime ./plugins/dbops \
  --gateway \
  --gateway-base-url https://connection-gateway.example.com \
  --gateway-tcp-url tcp://connection-gateway-tcp.example.com:3012 \
  --gateway-auth-token "$CONNECTION_GATEWAY_AUTH_TOKEN" \
  --gateway-jwt-secret "$JWT_SECRET" \
  --gateway-user-id u1
```

默认 source 为 `debug:user:{userId}`，同一个 CLI 进程会建立 1 个 TCP 通道并挂载所有传入的插件。断线后默认自动重连，正常退出时会清理 gateway session；如需关闭自动重连，可加 `--gateway-no-reconnect`。

### 待实现 / TODO

- **发布相关能力（publish）**
  - 提供 `cli publish` 命令，将构建好的工具包一键发布到 npm 或内部制品库
  - 支持从 `config.ts` / `package.json` 读取版本号并进行版本校验（防止重复发布）
  - 集成变更日志（changelog）生成和打 tag 流程
  - 可选的 dry-run 模式（仅输出将要执行的操作，不真正发布）
  - 支持自定义 npm registry / token 配置（环境变量或配置文件）
- **更多开发体验优化**
  - `watch` 模式：监听源码变化自动重新构建
  - 输出更友好的构建日志和错误提示
