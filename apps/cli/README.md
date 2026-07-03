## @fastgpt-plugin/cli

语言：[简体中文](./README.md) | [English](./README.en.md)

FastGPT 插件开发的命令行工具，用于创建、构建和测试 FastGPT 工具 / 工具集。

### 快速开始

```bash
npx @fastgpt-plugin/cli create dx-hello --type tool --description "DX hello world"
cd dx-hello
pnpm install
pnpm run dev
pnpm run debug
pnpm run debug:run
pnpm run build
pnpm run check
pnpm run pack
```

`pnpm run dev` 会调用 `fastgpt-plugin dev . --watch`，用于 FastGPT 远程集成调试。

仅在定义了对应 catalog entry 的 pnpm workspace 中使用 `--dependency-mode catalog`：

```bash
npx @fastgpt-plugin/cli create dx-hello --type tool --dependency-mode catalog
```

需要完整 stack trace 时，在命令中加 `--verbose`：

```bash
npx @fastgpt-plugin/cli --verbose check --entry . --output ./dist
```

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
- **集成开发会话**
  - 提供 `dev` 命令通过 Connection Gateway 建立 WSS 远程调试通道
  - 支持在一个通道内挂载多个本地插件，适合接入 FastGPT 测试环境
- **打包**
  - 提供 `pack` 命令把 `dist` 产物打成可上传的 `.pkg`

### 远程调试

本地插件可以通过 FastGPT 生成的长期 connection key 接入测试环境的 plugin-server。推荐路径是由 FastGPT 完成用户鉴权并开启 debug channel，CLI 使用 connection key 换取短期 WSS connect token。

```bash
fastgpt-plugin dev
```

启动后把 FastGPT 页面生成的 connection key 粘贴到 TUI 中即可。脚本或 Agent 场景可以显式传入：

```bash
fastgpt-plugin dev --no-interactive \
  --connect "fpg_dbg_..."
```

`--connect` 启动并成功连接后会覆盖本地持久配置 `config.json` 里的 connection key，后续 `fastgpt-plugin dev` 可直接复用该配置。TUI 运行中按 `c` 可以重新输入并保存 connection key；停止会话使用 `Ctrl+C`，再次按 `Ctrl+C` 强制退出。

使用裸 connection key 时，需要设置 `FASTGPT_PLUGIN_DEBUG_CONNECT_URL`，或设置 `FASTGPT_PLUGIN_SERVER_URL` 让 CLI 默认请求 `/api/plugin/debug-sessions/connection-key:exchange`。兼容场景仍可传入完整 connect link。exchange 结果会返回 gateway WSS 地址、`debug:tmbId:{tmbId}` source 和 scoped connect token。CLI 不需要 `CONNECTION_GATEWAY_AUTH_TOKEN` 或 `JWT_SECRET`。

`dev` 未传插件目录时会自动探测当前目录：如果当前目录有 `index.ts`，则把当前目录作为插件；否则扫描当前目录下一层子目录中的 `index.ts`。也可以手动传入多个插件目录。

```bash
fastgpt-plugin dev ./plugins/getTime ./plugins/dbops --watch
```

同一个 CLI 进程会建立 1 个 WSS 通道并挂载所有发现或传入的插件。断线后默认自动重连；如需关闭自动重连，可加 `--no-reconnect`。开发时可加 `--watch`，文件变化后会自动重载本地插件并重新建立远程调试会话。

`debug --connect` 仍作为兼容入口保留，但新的远程集成调试应使用 `dev`。`debug` 会继续聚焦单插件本地查看和一次性运行。

### 待实现 / TODO

- **发布相关能力（publish）**
  - 提供 `cli publish` 命令，将构建好的工具包一键发布到 npm 或内部制品库
  - 支持从 `config.ts` / `package.json` 读取版本号并进行版本校验（防止重复发布）
  - 集成变更日志（changelog）生成和打 tag 流程
  - 可选的 dry-run 模式（仅输出将要执行的操作，不真正发布）
  - 支持自定义 npm registry / token 配置（环境变量或配置文件）
- **更多开发体验优化**
  - 构建 `watch` 模式：监听源码变化自动重新构建
  - 输出更友好的构建日志和错误提示
