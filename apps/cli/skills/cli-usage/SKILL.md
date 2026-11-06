---
name: cli-usage
description: 使用 FastGPT plugin CLI 时启用，适用于创建插件项目、构建 dist 产物、校验构建输出、打包 .pkg 文件，以及指导用户选择 create/build/check/pack 命令和参数。
---

# FastGPT CLI 使用技能

在需要使用 FastGPT plugin CLI 完成插件创建、构建、检查或打包时使用这个技能。

## 适用场景

- 想创建一个新的 FastGPT 插件项目
- 想把插件源码构建成 `dist` 产物
- 想检查 `dist` 下的构建结果是否符合约定
- 想把构建产物打成 `.pkg`
- 不确定该用 `create`、`build`、`check` 还是 `pack`

## 常用命令

推荐两种调用方式：

```bash
npx @fastgpt-plugin/cli <command>
```

```bash
pnpm fastgpt-plugin <command>
```

### 1. 创建插件项目

创建单工具：

```bash
npx @fastgpt-plugin/cli create my-tool --type tool
```

创建工具集：

```bash
npx @fastgpt-plugin/cli create my-suite --type tool-suite
```

常用参数：

- `--cwd <path>`: 指定项目创建目录
- `--description <desc>`: 指定插件描述

说明：

- `tool` 会生成单工具模板
- `tool-suite` 会生成工具集模板

### 2. 构建插件

```bash
npx @fastgpt-plugin/cli build --entry ./path/to/plugin --output ./dist
```

常用参数：

- `--entry <path>`: 插件源码根目录
- `--output <path>`: 构建输出目录，默认 `./dist`
- `--minify`: 是否压缩
- `--format esm|cjs`: 输出格式

适用时机：

- 想先拿到 `dist/index.js`、`dist/manifest.json` 等产物
- `pack` 前先单独确认构建结果

### 3. 检查构建输出

```bash
npx @fastgpt-plugin/cli check --entry ./path/to/plugin --output ./dist
```

它会检查构建产物是否包含并满足约定：

- `manifest.json`
- `index.js`
- logo 引用

适用时机：

- 打包前做一次快速校验
- CI 中校验插件产物格式

### 4. 打包为 .pkg

```bash
npx @fastgpt-plugin/cli pack --entry ./path/to/plugin --dist ./dist --output ./out
```

常用参数：

- `--entry <path>`: 插件源码根目录
- `--dist <path>`: 构建产物目录，默认 `./dist`
- `--output <path>`: `.pkg` 输出目录
- `--name <name>`: 包名，默认取入口目录名

说明：

- `pack` 会先执行构建，再把构建产物打成 `.pkg`
- `.pkg` 里按约定包含 `index.js`、`manifest.json`、logo、可选的 `README.md` 及其多语言变体（`README.en.md`、`README.zh-CN.md`、`README.zh-Hant.md`）和 `assets/**`

### 5. README 多语言规范

插件项目可在根目录下提供多语言说明文档。构建 (`build`) 与打包 (`pack`) 会自动校验、收集并打入所有合法的变体：

- `README.md`：默认 / 兼容旧版本文档
- `README.en.md`：英文说明
- `README.zh-CN.md`：简体中文说明
- `README.zh-Hant.md`：繁体中文说明

规范与要求：

- **命名规范**：文件名严格区分大小写，且仅支持以上标准文件名。不支持的语言代码或非规范命名（如 `README.fr.md`、`README.zh-cn.md`）会在构建与打包时报错拦截。
- **排他性**：每种语言变体最多提供一个文件，不可重复定义同一语言。
- **兼容性**：仅有 `README.md` 的旧项目完全兼容；没有任何 README 时，`check` 命令会输出警告。
- **展示与回退**：服务端会将各语言版本分别托管至 `readmeUrls`，展示端通常优先按当前用户语言展示，缺失时依次回退到简体中文、英文，最终回退到 `readmeUrl`（默认 `README.md`）。

## 选择建议

- 只想生成项目骨架：用 `create`
- 已有源码，想得到构建产物：用 `build`
- 已有 `dist`，想校验格式：用 `check`
- 想直接得到最终 `.pkg`：用 `pack`

## 排查建议

- 命令无法执行：确认已安装 Node.js 和 pnpm，或直接使用 `npx @fastgpt-plugin/cli`
- 参数不确定：先运行 `npx @fastgpt-plugin/cli <command> --help`
- 构建失败：检查插件入口目录是否包含完整源码和 `manifest.json`
- 打包失败：先运行 `build` 和 `check`，确认 `dist` 产物符合约定

## 验证

```bash
npx @fastgpt-plugin/cli --help
```

如果项目中已经配置了 `pnpm fastgpt-plugin`：

```bash
pnpm fastgpt-plugin --help
```
