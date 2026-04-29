# FastGPT Plugin SDK Factory

用于构建 FastGPT Tool Plugin 的 TypeScript SDK。它把插件声明、输入输出校验、密钥配置、运行时通信和流式响应封装成少量 API，让工具开发者专注于业务逻辑。

TypeScript SDK for building FastGPT Tool Plugins. It wraps plugin metadata, input/output validation, secret configuration, runtime communication, and streaming responses behind a small API surface so tool authors can focus on business logic.

## 安装 / Installation

```bash
pnpm add @fastgpt-plugin/sdk-factory zod
```

在 monorepo 内开发时可直接使用 workspace 依赖。

When developing inside this monorepo, use the workspace dependency directly.

## 快速开始 / Quick Start

插件入口文件需要默认导出 `defineTool()` 或 `defineToolSet()` 返回的实例。

The plugin entry file must default-export the instance returned by `defineTool()` or `defineToolSet()`.

```ts
import { createToolHandler, defineTool } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    text: z.string()
  }),
  outputSchema: z.object({
    result: z.string()
  }),
  handler: async (input) => {
    return {
      result: input.text.toUpperCase()
    };
  }
});

export default defineTool({
  manifest: {
    pluginId: 'uppercase',
    version: '1.0.0',
    name: {
      en: 'Uppercase',
      'zh-CN': '转大写'
    },
    description: {
      en: 'Convert text to uppercase',
      'zh-CN': '将文本转换为大写'
    },
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    },
    tags: ['tools']
  },
  handler
});
```

## API / API

### `createToolHandler(definition)`

定义工具处理器，并通过 Zod schema 推导 `input`、`output` 和 `secrets` 类型。

Defines a tool handler and infers `input`, `output`, and `secrets` types from Zod schemas.

```ts
const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    answer: z.string()
  }),
  secretSchema: z.object({
    apiKey: z.string()
  }),
  handler: async (input, ctx) => {
    ctx.streamResponse({
      type: 'answer',
      content: `Searching: ${input.query}`
    });

    return {
      answer: `Result for ${input.query} with ${ctx.secrets?.apiKey}`
    };
  }
});
```

处理器上下文包含：

The handler context includes:

| 字段 / Field | 说明 / Description |
| --- | --- |
| `systemVar` | FastGPT 注入的系统变量。System variables injected by FastGPT. |
| `secrets` | 按 `secretSchema` 校验后的密钥配置。Secret values validated by `secretSchema`. |
| `invoke` | 反向调用宿主能力的客户端，例如上传文件。Client for invoking host capabilities, such as file upload. |
| `streamResponse` | 发送流式工具回答。Sends streaming tool answers. |

### `defineTool(options)`

定义单个工具插件。`manifest` 描述插件基础信息，`handler` 是工具执行逻辑。

Defines a single-tool plugin. `manifest` describes the plugin metadata, and `handler` contains the execution logic.

```ts
export default defineTool({
  manifest,
  handler
});
```

### `defineToolSet(options)`

定义一个包含多个子工具的工具集。所有子工具共用顶层 `manifest`，每个子工具拥有独立的 `id`、名称、描述和 handler。

Defines a tool set with multiple child tools. All child tools share the top-level `manifest`; each child tool has its own `id`, name, description, and handler.

```ts
const searchHandler = createToolHandler({
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ items: z.array(z.string()) }),
  handler: async (input) => ({ items: [input.query] })
});

const summaryHandler = createToolHandler({
  inputSchema: z.object({ content: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  handler: async (input) => ({ summary: input.content.slice(0, 100) })
});

export default defineToolSet({
  manifest: {
    pluginId: 'text-tools',
    version: '1.0.0',
    name: {
      en: 'Text Tools',
      'zh-CN': '文本工具集'
    },
    description: {
      en: 'Search and summarize text',
      'zh-CN': '搜索和总结文本'
    }
  },
  children: [
    {
      id: 'search',
      name: {
        en: 'Search',
        'zh-CN': '搜索'
      },
      description: {
        en: 'Search text',
        'zh-CN': '搜索文本'
      },
      toolDescription: 'Search text by query',
      handler: searchHandler
    },
    {
      id: 'summary',
      name: {
        en: 'Summary',
        'zh-CN': '总结'
      },
      description: {
        en: 'Summarize text',
        'zh-CN': '总结文本'
      },
      toolDescription: 'Summarize text content',
      handler: summaryHandler
    }
  ]
});
```

## Manifest / 插件声明

`manifest` 使用中英文国际化字段，常用字段如下：

`manifest` uses bilingual i18n fields. Common fields:

| 字段 / Field | 必填 / Required | 说明 / Description |
| --- | --- | --- |
| `pluginId` | 是 / Yes | 插件唯一 ID。Unique plugin ID. |
| `version` | 是 / Yes | 插件版本。Plugin version. |
| `name` | 是 / Yes | 插件名称，格式为 `{ en, 'zh-CN' }`。Plugin name in `{ en, 'zh-CN' }` format. |
| `description` | 是 / Yes | 插件描述，格式为 `{ en, 'zh-CN' }`。Plugin description in `{ en, 'zh-CN' }` format. |
| `versionDescription` | 否 / No | 版本说明。Version description. |
| `author` | 否 / No | 作者。Author. |
| `repoUrl` | 否 / No | 仓库地址。Repository URL. |
| `tutorialUrl` | 否 / No | 教程地址。Tutorial URL. |
| `tags` | 否 / No | 插件标签。Plugin tags. |
| `permission` | 否 / No | 插件权限声明。Plugin permission declarations. |
| `icon` | 否 / No | 插件图标；构建流程可自动补齐。Plugin icon; the build pipeline can fill it automatically. |
| `toolDescription` | 否 / No | 面向模型的工具说明；构建流程可自动补齐。Tool description for the model; the build pipeline can fill it automatically. |

## Secret 配置 / Secret Configuration

单工具可在 handler 内声明 `secretSchema`。工具集可在 `defineToolSet()` 顶层声明共用 `secretSchema`。

A single tool can declare `secretSchema` in its handler. A tool set can declare a shared `secretSchema` at the top level of `defineToolSet()`.

```ts
const secretSchema = z.object({
  apiKey: z.string()
});

const handler = createToolHandler({
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ text: z.string() }),
  secretSchema,
  handler: async (input, ctx) => {
    return {
      text: `${input.prompt}:${ctx.secrets?.apiKey}`
    };
  }
});
```

## 反向调用 / Host Invocation

`ctx.invoke` 用于调用 FastGPT 宿主能力。目前 SDK 提供文件上传能力。

Use `ctx.invoke` to call FastGPT host capabilities. The SDK currently exposes file upload.

```ts
const handler = createToolHandler({
  inputSchema: z.object({
    content: z.string()
  }),
  outputSchema: z.object({
    accessURL: z.string(),
    fileName: z.string(),
    size: z.number()
  }),
  handler: async (input, { invoke }) => {
    const [result, err] = await invoke.uploadFile({
      fileName: 'result.txt',
      contentType: 'text/plain',
      file: Buffer.from(input.content, 'utf-8')
    });

    if (err || !result) {
      throw new Error('Failed to upload file');
    }

    return {
      accessURL: result.accessURL,
      fileName: result.fileName,
      size: result.size
    };
  }
});
```

## 构建 / Build

```bash
pnpm --filter @fastgpt-plugin/sdk-factory build
```

构建后包入口为 `dist/index.js`，类型声明为 `dist/index.d.ts`。

After build, the package entry is `dist/index.js` and type declarations are emitted to `dist/index.d.ts`.
