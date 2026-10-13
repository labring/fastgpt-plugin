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
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
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
      toolDescription: {
        en: 'Search text by query',
        'zh-CN': '根据查询搜索文本'
      },
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
      toolDescription: {
        en: 'Summarize text content',
        'zh-CN': '总结文本内容'
      },
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
| `toolDescription` | 否 / No | 面向模型的工具说明，可使用普通字符串或 i18n 对象；构建流程可从工具描述补齐。Tool description for the model; accepts a string or i18n object and can fall back to the tool description during build. |

## Schema 文案与模型说明国际化 / Localized Schema Text and Model Instructions

为输入、输出、密钥字段添加 `'x-i18n'` 元数据，给用户界面提供英文和简体中文；繁体中文可选。JSON Schema 仍保留普通字符串字段，CLI 构建时会保留完整 `'x-i18n'`，并将其中的 `'zh-CN'` 值写入兼容的普通字符串 `title`、`description` 和 `placeholder` 字段。旧 manifest 中没有 `'x-i18n'` 的字段继续按原值使用。

Add `'x-i18n'` metadata to input, output, and secret fields to provide English and Simplified Chinese UI text; Traditional Chinese is optional. The CLI build preserves the complete `'x-i18n'` object and copies its `'zh-CN'` values into the compatible plain-string `title`, `description`, and `placeholder` fields. Fields in older manifests without `'x-i18n'` keep their original values.

```ts
const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string().meta({
      title: '查询',
      description: '用于检索的文本',
      'x-i18n': {
        title: { en: 'Query', 'zh-CN': '查询' },
        description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
        placeholder: { en: 'Enter a query', 'zh-CN': '输入查询文本' }
      },
      toolDescription: {
        en: 'The search text used to find matching items.',
        'zh-CN': '用于查找匹配项目的搜索文本。'
      },
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    answer: z.string().meta({
      title: '答案',
      'x-i18n': {
        title: { en: 'Answer', 'zh-CN': '答案' },
        description: { en: 'The search result', 'zh-CN': '搜索结果' }
      }
    } satisfies OutputSchemaMetaType)
  }),
  secretSchema: z.object({
    apiKey: z.string().meta({
      title: 'API 密钥',
      'x-i18n': {
        title: { en: 'API key', 'zh-CN': 'API 密钥' },
        placeholder: { en: 'Enter an API key', 'zh-CN': '输入 API 密钥' }
      },
      isSecret: true
    } satisfies SecretSchemaMetaType)
  }),
  handler: async (input) => ({ answer: `Result for ${input.query}` })
});
```

`toolDescription` 是独立的模型侧说明，可用于插件、工具集子工具和输入参数；新插件应提供含 `en`、`zh-CN` 的完整 i18n 对象，`zh-Hant` 可选。宿主按模型请求语言选择说明，缺少精确语言时依次回退到 `zh-CN`、`en`。旧插件中的字符串说明仍然有效，CLI 会原样保留，不会伪装成双语翻译。Schema 字段文案属于 UI 文案，不应代替模型侧 `toolDescription`。

`toolDescription` is separate model-facing text and can be set on a plugin, a tool-set child, or an input parameter. New plugins can provide a complete i18n object for the host to select for the model request. String descriptions in older plugins remain valid and are preserved as-is; the CLI does not present them as bilingual translations. Schema field text is UI copy and does not replace the model-facing `toolDescription`.

工具或子工具的模型说明也可写成：

A tool or child-tool model description can also use:

```ts
toolDescription: {
  en: 'Search for items that match the query.',
  'zh-CN': '搜索与查询内容匹配的项目。'
}
```

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

## 构建 / Build

```bash
pnpm --filter @fastgpt-plugin/sdk-factory build
```

构建后包入口为 `dist/index.js`，类型声明为 `dist/index.d.ts`。

After build, the package entry is `dist/index.js` and type declarations are emitted to `dist/index.d.ts`.
