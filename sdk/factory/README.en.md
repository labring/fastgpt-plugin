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

## API

### `createToolHandler(definition)`

Defines a tool handler and infers `input`, `output`, and `secrets` types from Zod schemas.

The handler context includes:

| Field | Description |
| --- | --- |
| `systemVar` | System variables injected by FastGPT. |
| `secrets` | Secret values validated by `secretSchema`. |
| `invoke` | Client for invoking host capabilities, such as file upload. |
| `streamResponse` | Sends streaming tool answers. |

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

Add `'x-i18n'` metadata to input, output, and secret fields to provide English and Simplified Chinese UI text; Traditional Chinese is optional. The CLI build preserves the complete `'x-i18n'` object and copies its `'zh-CN'` values into the compatible plain-string `title`, `description`, and `placeholder` fields. Fields in older manifests without `'x-i18n'` keep their original values.

```ts
const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string().meta({
      title: 'Query',
      description: 'Text to search for',
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
      title: 'Answer',
      'x-i18n': {
        title: { en: 'Answer', 'zh-CN': '答案' },
        description: { en: 'The search result', 'zh-CN': '搜索结果' }
      }
    } satisfies OutputSchemaMetaType)
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

Schema field metadata is written into the built JSON Schema through Zod `.meta()`. Use `InputSchemaMetaType` for input fields and optionally set `isToolParam: true` for input parameters recommended to be managed by AI. Use `OutputSchemaMetaType` for output fields and `SecretSchemaMetaType` for secret fields. Every `secretSchema` field must include `isSecret`; set it to `true` for values that need encrypted storage.

## Host Invocation

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

## Build

```bash
pnpm --filter @fastgpt-plugin/sdk-factory build
```

After build, the package entry is `dist/index.js` and type declarations are emitted to `dist/index.d.ts`.
