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
- `.pkg` 里按约定包含 `index.js`、`manifest.json`、logo、可选 `README.md` 和 `assets/**`

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
