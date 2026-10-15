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
  defineInputSchema,
  defineOutputSchema,
  defineTool,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: defineInputSchema({
    text: {
      type: z.string(),
      title: { en: 'Text', 'zh-CN': '文本' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    result: {
      type: z.string(),
      title: { en: 'Result', 'zh-CN': '结果' }
    }
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
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'Query', 'zh-CN': '查询' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    answer: {
      type: z.string(),
      title: { en: 'Answer', 'zh-CN': '答案' }
    }
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

### `defineInputSchema(fields)` 与 `defineOutputSchema(fields)`

两个 helper 接收字段描述对象，返回普通 Zod object；`type` 是 Zod schema 实例。每个字段的 `title` 必须包含 `en` 和 `'zh-CN'`，`'zh-Hant'` 可选。`description` 是可选的 UI 文案，使用相同的多语言格式。输入字段还可独立设置面向模型的 `toolDescription`（`string | I18nStringType`）和可选布尔值 `isToolParam`（包括 `false`）；输出字段不接受这两个选项。

Both helpers accept field descriptors and return ordinary Zod objects; `type` is a Zod schema instance. Every field `title` requires `en` and `'zh-CN'`, with optional `'zh-Hant'`. Optional `description` is localized UI copy in the same format. Input fields may independently set model-facing `toolDescription` (`string | I18nStringType`) and optional boolean `isToolParam` (including `false`); output fields have neither option.

```ts
const inputSchema = defineInputSchema({
  query: {
    type: z.string(),
    title: { en: 'Query', 'zh-CN': '查询' },
    description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
    toolDescription: {
      en: 'Search query used to find matching items.',
      'zh-CN': '用于查找匹配项目的搜索查询。'
    },
    isToolParam: true
  },
  limit: {
    type: z.number().int().optional(),
    title: { en: 'Limit', 'zh-CN': '数量上限' },
    isToolParam: false
  }
});

const outputSchema = defineOutputSchema({
  results: {
    type: z.array(defineOutputSchema({
      label: {
        type: z.string(),
        title: { en: 'Label', 'zh-CN': '标签' }
      }
    })),
    title: { en: 'Results', 'zh-CN': '结果' }
  }
});
```

The helpers add plain Chinese `title` and, when provided, `description` strings with complete `'x-i18n'` values. They preserve other existing `.meta()` metadata and return schema copies without mutating source schemas. Their results are ordinary Zod object schemas that work directly with `createToolHandler`. Zod's default object behavior still strips unknown keys; call `.strict()` on the returned object when strict validation is desired. Direct `.meta()` remains available for secrets and advanced metadata.

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
import {
  createToolHandler,
  defineInputSchema,
  defineOutputSchema,
  defineToolSet
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const searchHandler = createToolHandler({
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'Query', 'zh-CN': '查询' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    items: {
      type: z.array(z.string()),
      title: { en: 'Items', 'zh-CN': '项目' }
    }
  }),
  handler: async (input) => ({ items: [input.query] })
});

const summaryHandler = createToolHandler({
  inputSchema: defineInputSchema({
    content: {
      type: z.string(),
      title: { en: 'Content', 'zh-CN': '内容' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    summary: {
      type: z.string(),
      title: { en: 'Summary', 'zh-CN': '摘要' }
    }
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

输入和输出字段使用 schema helper 声明 UI 文案；helper 会生成普通字符串 `title`，并在提供 `description` 时生成对应的普通字符串，同时写入完整 `'x-i18n'` 多语言对象。密钥字段及高级 metadata 仍可通过 Zod `.meta()` 声明。CLI 构建会保留完整 `'x-i18n'`，并将其中的 `'zh-CN'` 值写入兼容的普通字符串 `title`、`description` 和 `placeholder` 字段。旧 manifest 中没有 `'x-i18n'` 的字段继续按原值使用。

Use schema helpers to declare UI copy for input and output fields; they generate a plain-string `title` and, when a `description` is provided, its plain-string value, together with complete `'x-i18n'` objects. Secret fields and advanced metadata can still be declared with Zod `.meta()`. The CLI build preserves the complete `'x-i18n'` object and copies its `'zh-CN'` values into compatible plain-string `title`, `description`, and `placeholder` fields. Fields in older manifests without `'x-i18n'` keep their original values.

const handler = createToolHandler({
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'Query', 'zh-CN': '查询' },
      description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
      toolDescription: {
        en: 'The search text used to find matching items.',
        'zh-CN': '用于查找匹配项目的搜索文本。'
      },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    answer: {
      type: z.string(),
      title: { en: 'Answer', 'zh-CN': '答案' },
      description: { en: 'The search result', 'zh-CN': '搜索结果' }
    }
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

输入和输出字段优先使用 `defineInputSchema()` 与 `defineOutputSchema()`；它们生成普通文案及 `'x-i18n'`，并保留 schema 上已有的其他 `.meta()` 元数据。低层 `.meta()` 仍可用于密钥字段和高级 metadata。密钥字段使用 `SecretSchemaMetaType`；`secretSchema` 的每个字段都要包含 `isSecret`，需要加密存储时设为 `true`。

Use `defineInputSchema()` and `defineOutputSchema()` for input and output fields; they generate plain compatibility text and `'x-i18n'` while preserving other `.meta()` metadata on the schema. Low-level `.meta()` remains available for secret fields and advanced metadata. Use `SecretSchemaMetaType` for secret fields; every `secretSchema` field must include `isSecret`, set to `true` for values that need encrypted storage.
对于直接编写 `z.object()` 或需要高级字段 metadata 的场景，低层 `.meta()` 路径仍可使用 `InputSchemaMetaType` 和 `OutputSchemaMetaType`；常规 UI 文案优先使用上述 helper。密钥字段继续使用 `SecretSchemaMetaType`。

For directly authored `z.object()` schemas or advanced field metadata, the low-level `.meta()` path remains available with `InputSchemaMetaType` and `OutputSchemaMetaType`; use the helpers for ordinary UI copy. Secret fields continue to use `SecretSchemaMetaType`.

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
  inputSchema: defineInputSchema({
    prompt: {
      type: z.string(),
      title: { en: 'Prompt', 'zh-CN': '提示词' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    text: {
      type: z.string(),
      title: { en: 'Text', 'zh-CN': '文本' }
    }
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
  inputSchema: defineInputSchema({
    content: {
      type: z.string(),
      title: { en: 'Content', 'zh-CN': '内容' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    accessURL: {
      type: z.string(),
      title: { en: 'Access URL', 'zh-CN': '访问地址' }
    },
    fileName: {
      type: z.string(),
      title: { en: 'File Name', 'zh-CN': '文件名' }
    },
    size: {
      type: z.number(),
      title: { en: 'Size', 'zh-CN': '大小' }
    }
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
