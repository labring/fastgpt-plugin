---
name: fastgpt-sdk-factory
description: Use when creating, reviewing, or modifying FastGPT Tool Plugins with the @fastgpt-plugin/sdk-factory TypeScript SDK, including defineTool, defineToolSet, createToolHandler, localized descriptions, schema metadata, secretSchema, ctx.invoke host calls, and streaming tool responses.
---

# FastGPT SDK Factory

Use this skill when working on a FastGPT Tool Plugin that imports `@fastgpt-plugin/sdk-factory` or the local `sdk/factory` package.

## Core Pattern

Plugin entry files default-export the instance returned by `defineTool()` or `defineToolSet()`.

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
  handler: async (input) => ({
    result: input.text.toUpperCase()
  })
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

## Schema Helpers

Use `defineInputSchema()` and `defineOutputSchema()` to build ordinary Zod object schemas from field descriptors. Each descriptor's `type` is a Zod schema instance and its required `title` includes `en` and `'zh-CN'` (`'zh-Hant'` is optional). Optional `description` is localized UI and tool-description text. Input descriptors additionally accept optional boolean `isToolParam`, including `false`; output descriptors accept neither option. Legacy `toolDescription` inputs are ignored and do not override or backfill `description`.

```ts
const inputSchema = defineInputSchema({
  query: {
    type: z.string(),
    title: { en: 'Query', 'zh-CN': '查询' },
    description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
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

The helpers add plain Chinese compatibility strings and full `'x-i18n'` values, preserve other existing `.meta()` metadata, and return schema copies without mutating source schemas. Their results work with `createToolHandler`; Zod's default object behavior strips unknown keys, and `.strict()` is an optional author choice. Direct `.meta()` remains useful for secrets and advanced metadata.

## Handler Rules

- Define handlers with `createToolHandler({ inputSchema, outputSchema, secretSchema?, handler })`; use ordinary Zod object schemas, including those returned by the schema helpers, so TypeScript infers `input` and return types.
- Use `defineInputSchema()` and `defineOutputSchema()` for input/output field metadata. Descriptor titles require `en` and `'zh-CN'`; `description` is the localized UI and tool-description source, and input-only `isToolParam` is an optional boolean.
- Legacy `toolDescription` fields are ignored and are not emitted in built manifests or schema metadata.
- Keep low-level `.meta()` for secrets and advanced metadata. When authoring `z.object()` schemas directly, `InputSchemaMetaType` and `OutputSchemaMetaType` remain available for field metadata. Import `SecretSchemaMetaType` for secrets and set `isSecret: true` for values that must be encrypted at rest.
- Return an object that matches `outputSchema`; throw errors for failed operations.
- Add `secretSchema` when plugin configuration needs secrets such as API keys.
- Read secrets from `ctx.secrets`; the value is typed from `secretSchema`.
- Use `ctx.streamResponse({ type: 'answer', content })` to emit incremental visible output before the final response.
- Use `ctx.systemVar` only for FastGPT-provided runtime variables.

```ts
const secretSchema = z.object({
  apiKey: z.string().meta({
    title: 'API Key',
    'x-i18n': {
      title: { en: 'API key', 'zh-CN': 'API 密钥' },
      placeholder: { en: 'Enter an API key', 'zh-CN': '输入 API 密钥' }
    },
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const handler = createToolHandler({
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'Query', 'zh-CN': '查询' },
      description: { en: 'Text to search for', 'zh-CN': '用于检索的文本' },
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
  secretSchema,
  handler: async (input, ctx) => {
    ctx.streamResponse({
      type: 'answer',
      content: `Searching: ${input.query}`
    });

    return {
      answer: `Result for ${input.query}`
    };
  }
});
```

## Manifest Rules

`manifest` must include these fields unless the surrounding package already supplies them:

- `pluginId`: stable unique plugin id.
- `version`: plugin version, usually semver.
- `name`: i18n object shaped as `{ en, 'zh-CN' }`.
- `description`: i18n object shaped as `{ en, 'zh-CN' }`.

Common optional fields:

- `versionDescription`
- `author`
- `repoUrl`
- `tutorialUrl`
- `tags`
- `permission`
- `icon`

The canonical `description` field supplies both UI and tool descriptions. Legacy `toolDescription` inputs are ignored; they do not override or backfill `description`.

Use `permission` to declare host capabilities required by the plugin. It is an array of permission strings. Declare only the minimum permissions that the plugin actually uses. When using `ctx.invoke` to call host capabilities, declare the matching permission.

Supported permissions:

- `userInfo:read`: read user information, for example through `ctx.invoke.userInfo()`.
- `teamInfo:read`: read team information.
- `model:read`: read model information.
- `dataset:read`: read dataset information.
- `file-upload:allow`: upload files, for example through `ctx.invoke.uploadFile()`.

Keep `pluginId`, child tool `id`, input field names, and output field names stable for compatibility.

## Tool Sets

Use `defineToolSet()` for one plugin with multiple child tools. Put shared metadata in the top-level `manifest`; put each child tool's `id`, `name`, `description`, optional `icon`, and `handler` in `children`.

```ts
import {
  createToolHandler,
  defineInputSchema,
  defineOutputSchema,
  defineToolSet,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  apiKey: z.string().meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

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
  secretSchema,
  handler: async (input) => ({ items: [input.query] })
});

export default defineToolSet({
  secretSchema,
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
      handler: searchHandler
    }
  ]
});
```

## Host Invocation

Use `ctx.invoke` for host capabilities. The SDK exposes `userInfo()` and `uploadFile()`. Declare the corresponding `manifest.permission` item before using a host capability; for example, `ctx.invoke.uploadFile()` requires `file-upload:allow`. These methods return a `Result` tuple shaped as `[result, err]`; check `err` before using `result`. When `err` is present, throw or return that original `err` so host-side error details are preserved.

```ts
const uploadHandler = createToolHandler({
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

## Local Development

- In external plugins, import from `@fastgpt-plugin/sdk-factory`.
- Inside this monorepo package tests or fixtures, imports may point at `sdk/factory/src` or `../../src/index` when matching existing local patterns.
- Build the SDK with `pnpm --filter @fastgpt-plugin/sdk-factory build`.
- When changing SDK behavior, check `sdk/factory/src/index.ts`, `sdk/factory/src/tool-factory.ts`, `sdk/factory/src/invoke.client.ts`, and fixtures under `sdk/factory/test/fixtures/`.
