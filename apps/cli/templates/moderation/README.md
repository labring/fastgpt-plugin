# {{name}}

{{description}}

这是一个**内容审查（moderation）**插件：把某个 provider 的审查接口映射成 FastGPT 的标准结构。

## Quick Start

```bash
pnpm install
pnpm run dev
pnpm run debug
pnpm run debug:run
pnpm run build
pnpm run check
pnpm run test
pnpm run pack
```

`pnpm run dev` 启动远程 FastGPT 集成调试（watch 模式），按提示粘贴 FastGPT 连接密钥，或直接传入：

```bash
fastgpt-plugin dev . --watch --connect '<connection-key-or-connect-link>'
```

`pnpm run debug` 打印插件 manifest、schema 与调试命令；`pnpm run debug:run` 用样例输入执行一次审查：

```bash
npx @fastgpt-plugin/cli debug . --run --input '{"content":"hello world","modality":"text"}'
```

## 本模板做了什么

模板是一个**不触网的关键词审查 provider**，用来演示标准结构的形状：

- `secretSchema` 声明两个配置项：`blockedKeywords`（命中即 `block`）、
  `suspiciousKeywords`（命中记 `suspected`），逗号分隔。
- `provider.check` 返回 `{ verdict, hits }`，每条命中给出 `label` / `providerLabel` / `keywords`。
  命中词由 `hits[].keywords` 承载，`result.keywords` 的并集由 SDK 统一派生，适配器不用自己算。
- 模板**不产出 `score`**：关键词匹配没有置信度，`score` 只应填 provider 原生给出的置信度
  （例如腾讯 `Score`、阿里云 `Confidence`），不要把枚举或布尔值编成数字。

## 裁决档位

`verdict` 分四档：`pass` / `block` / `suspected` / `error`。

- `suspected`（provider 判定疑似，建议人工复核）与 `error`（provider **没能**给出判定，例如
  超时、上游报错）必须分开。
- provider 无法判定时**必须返回 `verdict: 'error'` 的结果**，不要让异常逃出去：未捕获异常会被
  当成框架级失败（插件缺陷），与「provider 暂时不可用」无法区分。
- 是否放行由 FastGPT 决定，本层只输出档位与命中明细，不做阈值调档。

## 严格度

严格度由 provider 自己的配置项表达（例如厂商控制台的策略 ID：腾讯 `BizType`、百度
`strategyId`、易盾 `businessId`），框架不做归一化，也不提供全局审查级别开关。

## 模态

本版本框架只服务 `modality: 'text'`；`image` / `audio` / `video` 请求会得到明确的框架级错误，
不会静默当作文本处理。

## Output

- `pnpm run build` 产出 `dist/index.js`、`dist/manifest.json`、logo 与可选静态文件。
- `pnpm run check` 在上传前校验构建产物。
- `pnpm run pack` 生成可上传到 FastGPT Plugin 的 `.pkg` 文件。

## Dependency Mode

This project was generated with `{{dependencyMode}}` dependencies.

- `semver` uses published npm versions and works as a standalone plugin project.
- `catalog` is for pnpm workspace repositories that define matching catalog
  entries, such as the official plugin repository.

```bash
npx @fastgpt-plugin/cli create my-moderation --type moderation --dependency-mode catalog
```

## Troubleshooting

- Missing `index.ts`: run commands from the plugin project root, or pass
  `--entry <plugin-dir>`.
- Invalid JSON input: wrap input in a JSON object, for example `--input '{}'`.
- Need a stack trace: rerun the command with `--verbose`.
