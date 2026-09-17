# FastGPT Plugin SDK Factory

语言：[简体中文](./README.md) | [English](./README.en.md)

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
import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    text: z.string().meta({
      title: 'Text',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    result: z.string().meta({
      title: 'Result'
    } satisfies OutputSchemaMetaType)
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
    query: z.string().meta({
      title: 'Query',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    answer: z.string().meta({
      title: 'Answer'
    } satisfies OutputSchemaMetaType)
  }),
  secretSchema: z.object({
    apiKey: z.string().meta({
      title: 'API Key',
      isSecret: true
    } satisfies SecretSchemaMetaType)
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
  inputSchema: z.object({
    query: z.string().meta({
      title: 'Query',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    items: z.array(z.string()).meta({
      title: 'Items'
    } satisfies OutputSchemaMetaType)
  }),
  handler: async (input) => ({ items: [input.query] })
});

const summaryHandler = createToolHandler({
  inputSchema: z.object({
    content: z.string().meta({
      title: 'Content',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    summary: z.string().meta({
      title: 'Summary'
    } satisfies OutputSchemaMetaType)
  }),
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

Schema 字段元数据通过 Zod `.meta()` 写入构建后的 JSON Schema。输入字段使用 `InputSchemaMetaType`，推荐由 AI 托管补充的输入参数可设置 `isToolParam: true`。输出字段使用 `OutputSchemaMetaType`，密钥字段使用 `SecretSchemaMetaType`。`secretSchema` 的每个字段都要包含 `isSecret`，需要加密存储时设为 `true`。

Schema field metadata is written into the built JSON Schema through Zod `.meta()`. Use `InputSchemaMetaType` for input fields and optionally set `isToolParam: true` for input parameters recommended to be managed by AI. Use `OutputSchemaMetaType` for output fields and `SecretSchemaMetaType` for secret fields. Every `secretSchema` field must include `isSecret`; set it to `true` for values that need encrypted storage.

```ts
const secretSchema = z.object({
  apiKey: z.string().meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType),
  baseURL: z.url().meta({
    title: 'Base URL',
    isSecret: false
  } satisfies SecretSchemaMetaType)
});

const handler = createToolHandler({
  inputSchema: z.object({
    prompt: z.string().meta({
      title: 'Prompt',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    text: z.string().meta({
      title: 'Text'
    } satisfies OutputSchemaMetaType)
  }),
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
    content: z.string().meta({
      title: 'Content',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    accessURL: z.string().meta({
      title: 'Access URL'
    } satisfies OutputSchemaMetaType),
    fileName: z.string().meta({
      title: 'File Name'
    } satisfies OutputSchemaMetaType),
    size: z.number().meta({
      title: 'Size'
    } satisfies OutputSchemaMetaType)
  }),
  handler: async (input, { invoke }) => {
    const [result, err] = await invoke.uploadFile({
      fileName: 'result.txt',
      contentType: 'text/plain',
      file: Buffer.from(input.content, 'utf-8')
    });

    if (err) {
      throw err;
    }
    if (!result) {
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

## 内容审查插件 / Moderation Plugin

`defineModeration()` 用于编写**内容审查**插件：把某个 provider 的审查服务映射成 FastGPT 的标准结构。
是否放行由 FastGPT 决定，插件只输出裁决档位与逐项命中。

`defineModeration()` builds a **content moderation** plugin: it maps a provider's moderation service onto
the FastGPT standard structure. FastGPT decides whether to allow the content; the plugin only emits a
verdict and the per-hit details.

```ts
import { defineModeration, defineModerationManifest } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  accessKeyId: z.string().meta({ title: 'AccessKey ID', isSecret: true }),
  accessKeySecret: z.string().meta({ title: 'AccessKey Secret', isSecret: true })
});

export default defineModeration({
  manifest: defineModerationManifest({
    pluginId: 'my-moderation',
    version: '1.0.0',
    name: { en: 'My Moderation', 'zh-CN': '我的审查' },
    description: { en: 'Content moderation', 'zh-CN': '内容审查' },
    meta: {
      provider: 'baidu',
      modalities: ['text']
    }
  }),
  secretSchema,
  provider: {
    name: 'baidu',
    modalities: ['text'],
    check: async (input, ctx) => {
      try {
        const flags = await callProvider(input.content, ctx.secrets);
        return {
          verdict: flags.verdict, // pass | block | suspected | error
          hits: flags.hits.map((hit) => ({
            label: 'porn',                  // 归一化标签
            providerLabel: hit.label,       // provider 原生标签
            score: hit.confidence,          // provider 原生置信度 0-100
            keywords: hit.words
          }))
        };
      } catch (error) {
        // provider 无法判定 → error 档结果，不要抛异常
        return ctx.moderationError(`upstream failed: ${String(error)}`);
      }
    }
  }
});
```

### `provider.check(input, ctx)`

`ctx` 提供 `secrets`（按 `secretSchema` 校验后的配置）、`systemVar`、`invoke`（反向调用宿主）与
`moderationError(message)`（构造标准 error 档结果）。

`ctx` exposes `secrets` (validated against `secretSchema`), `systemVar`, `invoke` (host capabilities) and
`moderationError(message)` (builds a standard error-verdict result).

返回值约定 / Return value:

| 字段 / Field | 说明 / Description |
| --- | --- |
| `verdict` | `pass` / `block` / `suspected` / `error`。`suspected` 是 provider 判定疑似；`error` 是 provider **没能**给出判定。 |
| `hits[].label` | 归一化标签（`porn` / `politics` / `ad` / `other` 等）。 |
| `hits[].providerLabel` | provider 原生标签原文，归一化不丢信息。 |
| `hits[].score` | provider **原生**置信度 0-100；没有就省略，不要把枚举或布尔编成数字。 |
| `hits[].keywords` | 该标签命中的敏感词。 |
| `errorMessage` | `verdict === 'error'` 时必填。 |

`result.provider` 与 `result.keywords`（全部命中词并集）由 SDK 填充，适配器不用给。

`result.provider` and `result.keywords` (the union of hit keywords) are filled in by the SDK.

**provider 无法判定时返回 `verdict: 'error'` 的结果，不要抛异常**：未捕获异常会被当作框架级失败
（插件缺陷），与「provider 暂时不可用」无法区分。

**Return an `error` verdict result when the provider cannot decide; never let the exception escape**: an
uncaught error is treated as a framework-level failure (a plugin bug), which is indistinguishable from
"provider temporarily unavailable".

本版本框架只服务 `modality: 'text'`，其余模态会返回明确的框架级错误
（`plugin.moderation.modality_not_supported`），不会被静默当作文本处理。严格度由 provider 自己控制
（厂商控制台里的策略 ID / 分值），通过 `secretSchema` 透传，框架不做归一化。

This version serves `modality: 'text'` only; other modalities return an explicit framework error
(`plugin.moderation.modality_not_supported`). Strictness is owned by the provider (console-side policy id
or score thresholds) and passed through `secretSchema`; the framework does not normalise it.

## 构建 / Build

```bash
pnpm --filter @fastgpt-plugin/sdk-factory build
```

构建后包入口为 `dist/index.js`，类型声明为 `dist/index.d.ts`。

After build, the package entry is `dist/index.js` and type declarations are emitted to `dist/index.d.ts`.
