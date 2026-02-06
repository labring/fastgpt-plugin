## @fastgpt-plugin/cli

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

### 待实现 / TODO

- **发布相关能力（publish）**
  - 提供 `cli publish` 命令，将构建好的工具包一键发布到 npm 或内部制品库
  - 支持从 `config.ts` / `package.json` 读取版本号并进行版本校验（防止重复发布）
  - 集成变更日志（changelog）生成和打 tag 流程
  - 可选的 dry-run 模式（仅输出将要执行的操作，不真正发布）
  - 支持自定义 npm registry / token 配置（环境变量或配置文件）
- **项目脚手架**
  - 新建单工具模板（含 `config.ts`、`src/index.ts`、测试和示例）
  - 新建工具集模板（含 children 目录、共享配置示例）
- **更多开发体验优化**
  - `watch` 模式：监听源码变化自动重新构建
  - 输出更友好的构建日志和错误提示

