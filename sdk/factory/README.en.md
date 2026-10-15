# FastGPT Plugin SDK Factory

Language: [简体中文](./README.md) | [English](./README.en.md)

TypeScript SDK for building FastGPT Tool Plugins. It wraps plugin metadata, input/output validation, secret configuration, runtime communication, and streaming responses behind a small API surface so tool authors can focus on business logic.

## Installation

```bash
pnpm add @fastgpt-plugin/sdk-factory zod
```

When developing inside this monorepo, use the workspace dependency directly.

## Quick Start

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

## API

### `createToolHandler(definition)`

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
  handler: async (input, ctx) => ({
    answer: `Result for ${input.query} with ${ctx.secrets?.apiKey}`
  })
});
```

The handler context includes:

| Field | Description |
| --- | --- |
| `systemVar` | System variables injected by FastGPT. |
| `secrets` | Secret values validated by `secretSchema`. |
| `invoke` | Client for invoking host capabilities, such as file upload. |
| `streamResponse` | Sends streaming tool answers. |

### `defineInputSchema(fields)` and `defineOutputSchema(fields)`

Both helpers accept field descriptors and return ordinary Zod objects; `type` is a Zod schema instance. Every field `title` requires `en` and `'zh-CN'`, with optional `'zh-Hant'`. Optional `description` is localized UI copy in the same format. Input fields may independently set model-facing `toolDescription` (`string | I18nStringType`) and optional boolean `isToolParam` (including `false`); output fields have neither option.

```ts
const inputSchema = defineInputSchema({
  query: {
    type: z.string(),
    title: { en: 'Query', 'zh-CN': '查询' },
    description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
    toolDescription: {
      en: 'The search text used to find matching items.',
      'zh-CN': '用于查找匹配项目的搜索文本。'
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

Defines a single-tool plugin. `manifest` describes the plugin metadata, and `handler` contains the execution logic.

```ts
export default defineTool({
  manifest,
  handler
});
```

### `defineToolSet(options)`

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
    name: { en: 'Text Tools', 'zh-CN': '文本工具集' },
    description: {
      en: 'Search and summarize text',
      'zh-CN': '搜索和总结文本'
    }
  },
  children: [
    {
      id: 'search',
      name: { en: 'Search', 'zh-CN': '搜索' },
      description: { en: 'Search text', 'zh-CN': '搜索文本' },
      toolDescription: {
        en: 'Search text by query',
        'zh-CN': '根据查询搜索文本'
      },
      handler: searchHandler
    },
    {
      id: 'summary',
      name: { en: 'Summary', 'zh-CN': '总结' },
      description: { en: 'Summarize text', 'zh-CN': '总结文本' },
      toolDescription: {
        en: 'Summarize text content',
        'zh-CN': '总结文本内容'
      },
      handler: summaryHandler
    }
  ]
});
```

## Manifest

`manifest` uses bilingual i18n fields. Common fields:

| Field | Required | Description |
| --- | --- | --- |
| `pluginId` | Yes | Unique plugin ID. |
| `version` | Yes | Plugin version. |
| `name` | Yes | Plugin name in `{ en, 'zh-CN' }` format. |
| `description` | Yes | Plugin description in `{ en, 'zh-CN' }` format. |
| `versionDescription` | No | Version description. |
| `author` | No | Author. |
| `repoUrl` | No | Repository URL. |
| `tutorialUrl` | No | Tutorial URL. |
| `tags` | No | Plugin tags. |
| `permission` | No | Plugin permission declarations. |
| `icon` | No | Plugin icon; the build pipeline can fill it automatically. |
| `toolDescription` | No | Model-facing tool description; accepts a string or i18n object and can fall back to the tool description during build. |

## Localized Schema Text and Model Instructions

Use schema helpers to declare UI copy for input and output fields; they generate a plain-string `title` and, when a `description` is provided, its plain-string value, together with complete `'x-i18n'` objects. Secret fields and advanced metadata can still be declared with Zod `.meta()`. The CLI build preserves the complete `'x-i18n'` object and copies its `'zh-CN'` values into compatible plain-string `title`, `description`, and `placeholder` fields. Fields in older manifests without `'x-i18n'` keep their original values.

```ts
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
      title: 'API Key',
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

`toolDescription` is separate model-facing text and can be set on a plugin, a tool-set child, or an input parameter. New plugins should provide an i18n object with `en` and `'zh-CN'`; `'zh-Hant'` is optional. The host selects text for the model request locale and falls back from the exact locale to `'zh-CN'`, then `en`. String descriptions in older plugins remain valid and are preserved as-is; the CLI does not present them as bilingual translations. Schema field text is UI copy and does not replace the model-facing `toolDescription`.

A tool or child-tool model description can also use:

```ts
toolDescription: {
  en: 'Search for items that match the query.',
  'zh-CN': '搜索与查询内容匹配的项目。'
}
```

## Secret Configuration

A single tool can declare `secretSchema` in its handler. A tool set can declare a shared `secretSchema` at the top level of `defineToolSet()`.

New input/output fields should use the schema helpers. Direct `.meta()` remains valid for advanced low-level metadata, while secret fields use `SecretSchemaMetaType`. Every `secretSchema` field must include `isSecret`; set it to `true` for values that need encrypted storage.

For directly authored `z.object()` schemas or advanced field metadata, the low-level `.meta()` path remains available with `InputSchemaMetaType` and `OutputSchemaMetaType`; use the helpers for ordinary UI copy. Secret fields continue to use `SecretSchemaMetaType`.

## Host Invocation

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

## Build

```bash
pnpm --filter @fastgpt-plugin/sdk-factory build
```

After build, the package entry is `dist/index.js` and type declarations are emitted to `dist/index.d.ts`.
