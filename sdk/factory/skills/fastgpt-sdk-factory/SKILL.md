---
name: fastgpt-sdk-factory
description: Use when creating, reviewing, or modifying FastGPT Tool Plugins with the @fastgpt-plugin/sdk-factory TypeScript SDK, including defineTool, defineToolSet, createToolHandler, Zod input/output schemas, secretSchema, ctx.invoke host calls, and streaming tool responses.
---

# FastGPT SDK Factory

Use this skill when working on a FastGPT Tool Plugin that imports `@fastgpt-plugin/sdk-factory` or the local `sdk/factory` package.

## Core Pattern

Plugin entry files default-export the instance returned by `defineTool()` or `defineToolSet()`.

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
- Return an object that matches `outputSchema`; throw errors for failed operations.
- Add `secretSchema` when plugin configuration needs secrets such as API keys.
- Read secrets from `ctx.secrets`; the value is typed from `secretSchema`.
- Use `ctx.streamResponse({ type: 'answer', content })` to emit incremental visible output before the final response.
- Use `ctx.systemVar` only for FastGPT-provided runtime variables.

```ts
const secretSchema = z.object({
  apiKey: z.string()
});

const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    answer: z.string()
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

Keep `pluginId`, child tool `id`, input field names, and output field names stable for compatibility.

## Tool Sets

Use `defineToolSet()` for one plugin with multiple child tools. Put shared metadata in the top-level `manifest`; put each child tool's `id`, `name`, `description`, optional `icon`, optional `toolDescription`, and `handler` in `children`.

```ts
import { createToolHandler, defineToolSet } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  apiKey: z.string()
});

const searchHandler = createToolHandler({
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ items: z.array(z.string()) }),
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

Use `ctx.invoke` for host capabilities. The SDK exposes `userInfo()` and `uploadFile()`. These methods return a `Result` tuple shaped as `[result, err]`; check `err` before using `result`.

```ts
const uploadHandler = createToolHandler({
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

## Local Development

- In external plugins, import from `@fastgpt-plugin/sdk-factory`.
- Inside this monorepo package tests or fixtures, imports may point at `sdk/factory/src` or `../../src/index` when matching existing local patterns.
- Build the SDK with `pnpm --filter @fastgpt-plugin/sdk-factory build`.
- When changing SDK behavior, check `sdk/factory/src/index.ts`, `sdk/factory/src/tool-factory.ts`, `sdk/factory/src/invoke.client.ts`, and fixtures under `sdk/factory/test/fixtures/`.
