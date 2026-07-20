---
name: fastgpt-sdk-factory
description: Use when creating, reviewing, or modifying FastGPT Tool Plugins with the @fastgpt-plugin/sdk-factory TypeScript SDK, including defineTool, defineToolSet, createToolHandler, Zod input/output schemas, secretSchema, ctx.invoke host calls, and streaming tool responses.
---

# FastGPT SDK Factory

Use this skill when working on a FastGPT Tool Plugin that imports `@fastgpt-plugin/sdk-factory` or the local `sdk/factory` package.

## Core Pattern

Plugin entry files default-export the instance returned by `defineTool()` or `defineToolSet()`.

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

## Handler Rules

- Define handlers with `createToolHandler({ inputSchema, outputSchema, secretSchema?, handler })`.
- Use `z.object(...)` for `inputSchema` and `outputSchema` so TypeScript can infer `input` and return types.
- Import `InputSchemaMetaType`, `OutputSchemaMetaType`, and `SecretSchemaMetaType` from `@fastgpt-plugin/sdk-factory` when schema metadata is used.
- Add `.meta({ ... } satisfies InputSchemaMetaType)` to input fields and `.meta({ ... } satisfies OutputSchemaMetaType)` to output fields that need UI/manifest metadata.
- Set `isToolParam: true` in an input field's `.meta()` when that field is recommended to be managed by AI; use `toolDescription` for the model-facing parameter description.
- Add `.meta({ isSecret: true | false, ... } satisfies SecretSchemaMetaType)` to every `secretSchema` field; set `isSecret: true` for values that must be encrypted at rest.
- Return an object that matches `outputSchema`; throw errors for failed operations.
- Add `secretSchema` when plugin configuration needs secrets such as API keys.
- Read secrets from `ctx.secrets`; the value is typed from `secretSchema`.
- Use `ctx.streamResponse({ type: 'answer', content })` to emit incremental visible output before the final response.
- Use `ctx.systemVar` only for FastGPT-provided runtime variables.

```ts
const secretSchema = z.object({
  apiKey: z.string().meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string().meta({
      title: 'Query',
      toolDescription: 'Search query',
      isToolParam: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    answer: z.string().meta({
      title: 'Answer'
    } satisfies OutputSchemaMetaType)
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
- `toolDescription`

Use `permission` to declare host capabilities required by the plugin. It is an array of permission strings. Declare only the minimum permissions that the plugin actually uses. When using `ctx.invoke` to call host capabilities, declare the matching permission.

Supported permissions:

- `userInfo:read`: read user information, for example through `ctx.invoke.userInfo()`.
- `teamInfo:read`: read team information.
- `model:read`: read model information.
- `dataset:read`: read dataset information.
- `file-upload:allow`: upload files, for example through `ctx.invoke.uploadFile()`.

Keep `pluginId`, child tool `id`, input field names, and output field names stable for compatibility.

## Tool Sets

Use `defineToolSet()` for one plugin with multiple child tools. Put shared metadata in the top-level `manifest`; put each child tool's `id`, `name`, `description`, optional `icon`, optional `toolDescription`, and `handler` in `children`.

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
  apiKey: z.string().meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

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
      toolDescription: 'Search text by query',
      handler: searchHandler
    }
  ]
});
```

## Host Invocation

Use `ctx.invoke` for host capabilities. The SDK exposes `userInfo()` and `uploadFile()`. Declare the corresponding `manifest.permission` item before using a host capability; for example, `ctx.invoke.uploadFile()` requires `file-upload:allow`. These methods return a `Result` tuple shaped as `[result, err]`; check `err` before using `result`. When `err` is present, throw or return that original `err` so host-side error details are preserved.

```ts
const uploadHandler = createToolHandler({
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

## Local Development

- In external plugins, import from `@fastgpt-plugin/sdk-factory`.
- Inside this monorepo package tests or fixtures, imports may point at `sdk/factory/src` or `../../src/index` when matching existing local patterns.
- Build the SDK with `pnpm --filter @fastgpt-plugin/sdk-factory build`.
- When changing SDK behavior, check `sdk/factory/src/index.ts`, `sdk/factory/src/tool-factory.ts`, `sdk/factory/src/invoke.client.ts`, and fixtures under `sdk/factory/test/fixtures/`.
