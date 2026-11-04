# {{name}}

{{description}}

语言：[简体中文](./README.zh-CN.md) | [English](./README.en.md) | [默认](./README.md)

## 快速开始

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

`pnpm run dev` 启动带有监听模式的 FastGPT 远程联调会话。出现提示时粘贴 FastGPT 连接密钥，或直接传入：

```bash
fastgpt-plugin dev . --watch --connect '<connection-key-or-connect-link>'
```

`pnpm run debug` 输出插件 manifest、schema 及子工具调试命令。`pnpm run debug:run` 使用示例 JSON 输入执行一次工具调用。对于有必填入参的工具，请替换示例输入：

```bash
npx @fastgpt-plugin/cli debug . --run{{debugRunToolOption}} --input '{{debugRunInput}}'
```

## 构建产物

- `pnpm run build` 输出 `dist/index.js`、`dist/manifest.json`、logo 图标及静态文件（包括多语言 README 文档）。
- `pnpm run check` 在上传前校验构建输出是否符合规范。
- `pnpm run pack` 打包生成可上传至 FastGPT Plugin 的 `.pkg` 文件。

## 文档与多语言 (I18n)

FastGPT 插件支持在项目根目录下提供多语言说明文档。CLI 构建与打包时会自动识别并打包以下规范文件：

- `README.md`：默认 / 兜底兼容文档
- `README.en.md`：英文说明
- `README.zh-CN.md`：简体中文说明
- `README.zh-Hant.md`：繁体中文说明

文件名严格区分大小写。展示端将优先展示当前用户偏好语言，缺失时依次回退到简体中文 (`zh-CN`)、英文 (`en`) 及默认 `README.md`。

## 依赖模式

本项目使用 `{{dependencyMode}}` 依赖模式生成：

- `semver` 使用已发布的 npm 版本号，适合作为独立插件项目维护。
- `catalog` 适用于配置了对应 catalog 依赖项的 pnpm workspace 仓库（如官方插件仓库）。

如需生成 workspace 模式的项目：

```bash
npx @fastgpt-plugin/cli create my-tool --type tool --dependency-mode catalog
```

## 排查建议

- 缺少 `index.ts`：请在插件项目根目录运行命令，或传入 `--entry <plugin-dir>`。
- JSON 输入非法：请确保参数为有效的 JSON 对象，例如 `--input '{}'`。
- 需要查看调用堆栈：重新运行命令并加上 `--verbose`。
