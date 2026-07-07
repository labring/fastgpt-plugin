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
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    text: z.string().meta({
      title: 'Text',
      isToolParams: true
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
| `toolDescription` | No | Tool description for the model; the build pipeline can fill it automatically. |

## Secret Configuration

A single tool can declare `secretSchema` in its handler. A tool set can declare a shared `secretSchema` at the top level of `defineToolSet()`.

Schema field metadata is written into the built JSON Schema through Zod `.meta()`. Use `InputSchemaMetaType` for input fields and optionally set `isToolParams: true` for input parameters recommended to be managed by AI. Use `OutputSchemaMetaType` for output fields and `SecretSchemaMetaType` for secret fields. Every `secretSchema` field must include `isSecret`; set it to `true` for values that need encrypted storage.

## Host Invocation

Use `ctx.invoke` to call FastGPT host capabilities. The SDK currently exposes file upload.

```ts
const handler = createToolHandler({
  inputSchema: z.object({
    content: z.string().meta({
      title: 'Content',
      isToolParams: true
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
