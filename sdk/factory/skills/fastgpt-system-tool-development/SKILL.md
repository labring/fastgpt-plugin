---
name: fastgpt-system-tool-development
description: Use when writing a FastGPT system tool plugin with @fastgpt-plugin/sdk-factory and @fastgpt-plugin/cli, including tool structure, SDK writing rules, required files, avatar/logo naming, and build/check/pack tooling.
---

# FastGPT 系统工具开发规范

在编写 FastGPT 系统工具插件时使用这个 skill。目标是指导代理用 `@fastgpt-plugin/sdk-factory` 写出符合 FastGPT 约定的系统工具，并用 `@fastgpt-plugin/cli` 创建、构建、检查和打包。

## 使用工具

同时参考这些能力：

- `fastgpt-sdk-factory`: 处理 `defineTool()`、`defineToolSet()`、`createToolHandler()`、Zod schema、`secretSchema`、`ctx.invoke`、`ctx.streamResponse()` 等 SDK 写法。
- `cli-usage`: 使用 `@fastgpt-plugin/cli` 的 `create`、`build`、`check`、`pack` 命令。

常用命令：

```bash
npx @fastgpt-plugin/cli create <plugin-name> --type tool --cwd <target-directory>
```

```bash
npx @fastgpt-plugin/cli create <plugin-name> --type tool-suite --cwd <target-directory>
```

```bash
npx @fastgpt-plugin/cli build --entry <plugin-directory> --output <plugin-directory>/dist
```

```bash
npx @fastgpt-plugin/cli check --entry <plugin-directory> --output <plugin-directory>/dist
```

```bash
npx @fastgpt-plugin/cli pack --entry <plugin-directory> --dist <plugin-directory>/dist --output <plugin-directory>/out
```

## 系统工具包含内容

一个系统工具目录通常包含：

- `index.ts`: 系统工具入口，默认导出 `defineTool()` 或 `defineToolSet()` 的返回值。
- `package.json`: 声明依赖和 `build`、`build:dev`、`pack`、`test` 脚本。
- `logo.<ext>`: 主工具头像，必须放在工具根目录。
- `README.md`: 工具用途、输入、输出、密钥配置和使用说明。
- `assets/`: 可选资源目录，例如图标或示例资源。
- `dist/`: CLI 构建输出目录，包含 `index.js`、`manifest.json` 和必要资源。
- `out/`: CLI 打包输出目录，通常包含 `.pkg` 文件。

依赖建议：

- 运行依赖：`@fastgpt-plugin/sdk-factory`、`zod`。
- 开发依赖：`@fastgpt-plugin/cli`、`typescript`、`vitest`。

## 系统工具写法

入口文件必须默认导出 SDK factory 实例：

- 单工具使用 `defineTool()`。
- 多个相关工具组成一个插件时使用 `defineToolSet()`。
- 每个 handler 用 `createToolHandler()` 定义。
- `inputSchema` 和 `outputSchema` 使用 `z.object(...)`。
- `inputSchema` 字段使用 `.meta({ ... } satisfies InputSchemaMetaType)`。
- `inputSchema` 字段需要被工具调用自动填参时，必须在 `.meta()` 中设置 `toolDescription`；未设置时该字段只能由用户手动指定。
- `outputSchema` 字段使用 `.meta({ ... } satisfies OutputSchemaMetaType)`。
- `secretSchema` 字段使用 `.meta({ isSecret: true | false, ... } satisfies SecretSchemaMetaType)`；需要加密存储的字段标记为 `isSecret: true`。
- handler 返回值必须匹配 `outputSchema`。

manifest 至少包含：

- `pluginId`: 稳定唯一工具 ID。
- `version`: 工具版本。
- `name`: `{ en, 'zh-CN' }` 格式。
- `description`: `{ en, 'zh-CN' }` 格式。

常用可选字段：

- `versionDescription`
- `author`
- `repoUrl`
- `tutorialUrl`
- `tags`
- `permission`
- `icon`
- `toolDescription`

`permission` 用于声明插件运行时需要的宿主能力，类型为权限字符串数组。只声明当前插件实际使用的最小权限；没有使用对应能力时不要添加。使用 `ctx.invoke` 反向调用宿主能力时，必须声明对应权限。

当前可用权限：

- `userInfo:read`: 读取用户信息，例如调用 `ctx.invoke.userInfo()`。
- `teamInfo:read`: 读取团队信息。
- `model:read`: 读取模型信息。
- `dataset:read`: 读取知识库信息。
- `file-upload:allow`: 上传文件，例如调用 `ctx.invoke.uploadFile()`。

兼容性要求：

- `pluginId`、工具 `id`、输入字段名、输出字段名对外使用后保持稳定。
- 用户配置的密钥、API Key、Base URL 等使用 `secretSchema` 描述，通过 `ctx.secrets` 读取。
- 错误信息应能帮助定位问题，同时避免暴露密钥、令牌和完整上游敏感响应。
- 需要向用户展示执行进度时使用 `ctx.streamResponse()`。
- 需要生成文件时使用 `ctx.invoke.uploadFile()`，并在 `manifest.permission` 中声明 `file-upload:allow`；收到 `[result, err]` 的 `err` 时保留原始 `err`，避免覆盖反向调用的宿主错误信息。

## 头像规范

CLI 构建时会自动扫描系统工具根目录中的头像文件，并写入 `manifest.icon` 或子工具 `icon` 字段。工具代码里通常不用手写 `icon`。

命名方式：

- 主工具头像：`logo.<ext>`，例如 `logo.svg`、`logo.png`。
- 工具集子工具头像：`<childId>.logo.<ext>`，例如子工具 `id` 为 `search` 时使用 `search.logo.svg`。
- 子工具没有独立头像时，CLI 会复用主工具头像。

格式限制：

- 支持扩展名：`.svg`、`.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`。
- 头像文件必须放在系统工具根目录，不能放在 `assets/` 后再通过 manifest 引用。
- `childId` 必须和 `defineToolSet({ children })` 中的子工具 `id` 完全一致。
- 避免使用空格、中文或特殊符号作为头像文件名的一部分。
- `logo.*` 和 `<childId>.logo.*` 只保留一个匹配文件，避免不同扩展名同时存在导致扫描结果不明确。
- `build` 后检查 `dist/manifest.json` 中的 `icon` 字段是否指向已复制到 `dist/` 的头像文件。

## 单工具模板

```ts
import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    text: z.string().min(1).meta({
      title: 'Text',
      toolDescription: 'Text to normalize'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    result: z.string().meta({
      title: 'Result'
    } satisfies OutputSchemaMetaType)
  }),
  handler: async (input) => {
    return {
      result: input.text.trim()
    };
  }
});

export default defineTool({
  manifest: {
    pluginId: 'text-normalizer',
    version: '1.0.0',
    name: {
      en: 'Text Normalizer',
      'zh-CN': '文本规范化'
    },
    description: {
      en: 'Normalize input text',
      'zh-CN': '规范化输入文本'
    },
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    },
    permission: []
  },
  handler
});
```

## 工具集模板

```ts
import {
  createToolHandler,
  defineToolSet,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  apiKey: z.string().min(1).meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const searchHandler = createToolHandler({
  inputSchema: z.object({
    query: z.string().min(1).meta({
      title: 'Query',
      toolDescription: 'Search query'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    items: z.array(z.string()).meta({
      title: 'Items'
    } satisfies OutputSchemaMetaType)
  }),
  secretSchema,
  handler: async (input, ctx) => {
    ctx.streamResponse({
      type: 'answer',
      content: `Searching: ${input.query}`
    });

    return {
      items: []
    };
  }
});

export default defineToolSet({
  secretSchema,
  manifest: {
    pluginId: 'example-search-tools',
    version: '1.0.0',
    name: {
      en: 'Example Search Tools',
      'zh-CN': '示例搜索工具集'
    },
    description: {
      en: 'Search public example data',
      'zh-CN': '搜索公开示例数据'
    },
    permission: []
  },
  children: [
    {
      id: 'search',
      name: {
        en: 'Search',
        'zh-CN': '搜索'
      },
      description: {
        en: 'Search by query',
        'zh-CN': '按查询搜索'
      },
      toolDescription: 'Search public example data by query',
      handler: searchHandler
    }
  ]
});
```

## 验证重点

- `index.ts` 默认导出正确。
- `manifest` 字段完整，国际化字段包含 `en` 和 `zh-CN`。
- `permission` 只包含插件实际使用的权限，且权限值来自当前支持的枚举。
- 使用 `ctx.invoke` 时已在 `manifest.permission` 声明对应权限，例如上传文件声明 `file-upload:allow`。
- Zod schema 覆盖全部用户可见输入和输出；需要工具调用自动填参的输入字段包含 `toolDescription`。
- handler 成功路径返回值与 `outputSchema` 一致。
- 外部调用失败、空响应、超时、鉴权失败都有明确错误。
- 密钥配置只通过 `secretSchema` 和 `ctx.secrets` 处理。
- 系统工具根目录存在 `logo.<ext>`。
- 工具集子工具头像按 `<childId>.logo.<ext>` 命名，或确认复用主头像。
- `build` 后存在 `dist/index.js` 和 `dist/manifest.json`。
- `check` 通过后再执行 `pack`。
