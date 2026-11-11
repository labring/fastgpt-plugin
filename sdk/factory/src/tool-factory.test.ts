import { afterEach, describe, expect, it } from 'vitest';
import z from 'zod';

import { InvokeMethodEnum } from '@domain/ports/invoke.port';
import { ToolManifestSchema } from '@domain/value-objects/plugin/plugin-manifest.vo';
import { failureResult } from '@domain/value-objects/result.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import {
  createLocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from '../../../apps/cli/src/debug/runtime';

import {
  createToolHandler,
  defineTool,
  defineToolSet,
  type I18nSchemaMetaType,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType,
  ToolMessageContentPartSchema,
  type ToolMessageContentPartType
} from './index';

describe('ToolFactory streaming', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;

  afterEach(() => {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  });

  it('returns the output stream before the handler completes', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    let finishHandler!: () => void;
    const handlerCanFinish = new Promise<void>((resolve) => {
      finishHandler = resolve;
    });

    defineTool({
      manifest: {
        pluginId: 'stream-test',
        name: { en: 'Stream Test', 'zh-CN': '流式测试' },
        description: { en: 'Stream Test', 'zh-CN': '流式测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          ok: z.boolean()
        }),
        handler: async (_input, ctx) => {
          ctx.streamResponse({
            type: 'answer',
            content: 'first chunk'
          });
          await handlerCanFinish;

          return {
            ok: true
          };
        }
      })
    });

    await runtime.waitUntilReady();

    const responsePromise = runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const timedOut = Symbol('timedOut');
    const responseOrTimeout = await Promise.race([responsePromise, delay(50).then(() => timedOut)]);

    try {
      expect(responseOrTimeout).not.toBe(timedOut);
      const response = responseOrTimeout as Awaited<typeof responsePromise>;
      expect(response.output).toBeDefined();

      const messages: ToolStreamMessageType[] = [];
      await response.output!.stream.consume(async (chunk) => {
        messages.push(chunk);
        if (messages.length === 1) {
          finishHandler();
        }
      });

      expect(messages).toEqual([
        {
          type: 'stream',
          data: {
            type: 'answer',
            content: 'first chunk'
          }
        },
        {
          type: 'response',
          data: {
            ok: true
          }
        }
      ]);
    } finally {
      finishHandler();
    }
  });

  it('keeps reverse invocation errors in the tool stream error event', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'invoke-error-test',
        name: { en: 'Invoke Error Test', 'zh-CN': '反向调用错误测试' },
        description: { en: 'Invoke Error Test', 'zh-CN': '反向调用错误测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          ok: z.boolean()
        }),
        handler: async (_input, ctx) => {
          const [, err] = await ctx.invoke.userInfo();

          if (err) {
            throw err;
          }

          return {
            ok: true
          };
        }
      })
    });

    runtime.setHostRequestHandler(({ method, args }) => {
      expect(method).toBe(InvokeMethodEnum.userInfo);
      expect(args).toEqual({});

      return failureResult(
        {
          en: 'Host user info failed',
          'zh-CN': '宿主用户信息失败'
        },
        new Error('upstream user info unavailable')
      );
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'error',
        data: '获取用户信息失败: 宿主用户信息失败: upstream user info unavailable'
      }
    ]);
  });

  it('keeps uploadFile reverse invocation errors when handlers rethrow err', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'upload-invoke-error-test',
        name: { en: 'Upload Invoke Error Test', 'zh-CN': '上传反向调用错误测试' },
        description: { en: 'Upload Invoke Error Test', 'zh-CN': '上传反向调用错误测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          accessURL: z.string()
        }),
        handler: async (_input, ctx) => {
          const [result, err] = await ctx.invoke.uploadFile({
            fileName: 'result.txt',
            contentType: 'text/plain',
            file: Buffer.from('hello', 'utf-8')
          });

          if (err) {
            throw err;
          }
          if (!result) {
            throw new Error('Failed to upload file');
          }

          return {
            accessURL: result.accessURL
          };
        }
      })
    });

    runtime.setHostRequestHandler(({ method }) => {
      expect(method).toBe(InvokeMethodEnum.uploadFile);

      return failureResult(
        {
          en: 'Host upload failed',
          'zh-CN': '宿主上传失败'
        },
        new Error('storage quota exceeded')
      );
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'error',
        data: '上传文件失败: 宿主上传失败: storage quota exceeded'
      }
    ]);
  });

  it('consumes StreamData-like output across duplicated package instances', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    const streamLike = createStreamDataLike<ToolStreamMessageType>();

    runtime.pluginChannel.setRequestHandler(() =>
      runtime.pluginChannel.createReply(undefined, {
        output: streamLike
      })
    );

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    streamLike.write({
      type: 'response',
      data: {
        ok: true
      }
    });
    streamLike.end();

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          ok: true
        }
      }
    ]);
  });
});

describe('ToolFactory response content parts', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;

  afterEach(() => {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  });

  it('streams structured content parts in the response data', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'content-parts-test',
        name: { en: 'Content Parts Test', 'zh-CN': '内容部分测试' },
        description: { en: 'Content Parts Test', 'zh-CN': '内容部分测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.array(ToolMessageContentPartSchema)
        }),
        handler: async () => {
          const content: ToolMessageContentPartType[] = [
            { type: 'text', text: 'generated image' },
            { type: 'image_url', image_url: { url: 'https://example.com/a.png' } }
          ];

          return { content };
        }
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: [
            { type: 'text', text: 'generated image' },
            { type: 'image_url', image_url: { url: 'https://example.com/a.png' } }
          ]
        }
      }
    ]);
  });

  it('passes legacy string content through the response data', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'legacy-string-content-test',
        name: { en: 'Legacy String Content Test', 'zh-CN': '旧字符串内容测试' },
        description: { en: 'Legacy String Content Test', 'zh-CN': '旧字符串内容测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.string(),
          title: z.string()
        }),
        handler: async () => ({
          content: 'ordinary document text',
          title: 'Result'
        })
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: 'ordinary document text',
          title: 'Result'
        }
      }
    ]);
  });

  it('accepts an empty content array', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'empty-content-test',
        name: { en: 'Empty Content Test', 'zh-CN': '空内容测试' },
        description: { en: 'Empty Content Test', 'zh-CN': '空内容测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.array(ToolMessageContentPartSchema)
        }),
        handler: async () => ({
          content: []
        })
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: []
        }
      }
    ]);
  });

  it('keeps unknown fields alongside valid content parts', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'extra-fields-test',
        name: { en: 'Extra Fields Test', 'zh-CN': '附加字段测试' },
        description: { en: 'Extra Fields Test', 'zh-CN': '附加字段测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.array(ToolMessageContentPartSchema),
          count: z.number(),
          summary: z.string()
        }),
        handler: async () => {
          const content: ToolMessageContentPartType[] = [{ type: 'text', text: 'see below' }];

          return { content, count: 3, summary: 'done' };
        }
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: [{ type: 'text', text: 'see below' }],
          count: 3,
          summary: 'done'
        }
      }
    ]);
  });

  it('passes malformed content parts through without wire validation', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'malformed-parts-test',
        name: { en: 'Malformed Parts Test', 'zh-CN': '非法部分透传测试' },
        description: { en: 'Malformed Parts Test', 'zh-CN': '非法部分透传测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.array(ToolMessageContentPartSchema)
        }),
        handler: async () =>
          ({
            content: [
              {
                type: 'image_url',
                image_url: { url: 'https://example.com/a.png', detail: 'ultra' }
              }
            ]
          }) as unknown as {
            content: ToolMessageContentPartType[];
          }
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: [
            {
              type: 'image_url',
              image_url: { url: 'https://example.com/a.png', detail: 'ultra' }
            }
          ]
        }
      }
    ]);
  });

  it('passes legacy object and array content through the response data', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'legacy-structured-content-test',
        name: { en: 'Legacy Structured Content Test', 'zh-CN': '旧结构化内容测试' },
        description: { en: 'Legacy Structured Content Test', 'zh-CN': '旧结构化内容测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          content: z.unknown(),
          items: z.unknown()
        }),
        handler: async () => ({
          content: { text: 'business payload' },
          items: [1, 'two', { three: true }]
        })
      })
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const messages: ToolStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          content: { text: 'business payload' },
          items: [1, 'two', { three: true }]
        }
      }
    ]);
  });
});

describe('ToolFactory schema metadata', () => {
  const localized = {
    en: 'Localized text',
    'zh-CN': '本地化文案',
    'zh-Hant': '本地化文案'
  };
  const localizedMeta: I18nSchemaMetaType = {
    title: localized,
    description: localized,
    placeholder: localized
  };

  it('keeps x-i18n alongside legacy string metadata in generated JSON Schema', () => {
    const secretSchema = z.object({
      apiKey: z.string().meta({
        title: 'API Key',
        description: 'API authentication key',
        isSecret: true,
        'x-i18n': localizedMeta
      } satisfies SecretSchemaMetaType)
    });

    const handler = createToolHandler({
      inputSchema: z.object({
        query: z.string().meta({
          title: 'Query',
          description: 'Search query',
          isToolParam: true,
          'x-i18n': localizedMeta
        } satisfies InputSchemaMetaType)
      }),
      outputSchema: z.object({
        answer: z.string().meta({
          title: 'Answer',
          description: 'Answer text',
          'x-i18n': localizedMeta
        } satisfies OutputSchemaMetaType)
      }),
      secretSchema,
      handler: async (input) => ({
        answer: input.query
      })
    });

    const inputSchema = z.toJSONSchema(handler.inputSchema) as JsonSchemaObject;
    const outputSchema = z.toJSONSchema(handler.outputSchema) as JsonSchemaObject;
    const secretJsonSchema = z.toJSONSchema(secretSchema) as JsonSchemaObject;

    expect(inputSchema.properties?.query).toMatchObject({
      title: 'Query',
      description: 'Search query',
      isToolParam: true,
      'x-i18n': {
        title: localized,
        description: localized,
        placeholder: localized
      }
    });
    expect(inputSchema.properties?.query).not.toHaveProperty('toolDescription');
    expect(outputSchema.properties?.answer).toMatchObject({
      title: 'Answer',
      description: 'Answer text',
      'x-i18n': {
        title: localized,
        description: localized
      }
    });
    expect(secretJsonSchema.properties?.apiKey).toMatchObject({
      title: 'API Key',
      description: 'API authentication key',
      isSecret: true,
      'x-i18n': {
        title: localized,
        description: localized,
        placeholder: localized
      }
    });
  });

  it('preserves legacy tool descriptions in manifests', () => {
    const toolDescription = {
      en: 'Find public documentation',
      'zh-CN': '查找公开文档'
    };
    const name = {
      en: 'Search',
      'zh-CN': '搜索'
    };
    const description = {
      en: 'Search public documentation',
      'zh-CN': '搜索公开文档'
    };

    const manifestBase = {
      pluginId: 'localized-description-tool',
      name,
      description,
      version: '0.0.1',
      versionDescription: description,
      icon: 'plugin.svg',
      tags: ['tools'] as const,
      secretSchema: {}
    };
    const manifest = ToolManifestSchema.parse({
      ...manifestBase,
      type: 'tool',
      toolDescription,
      children: [
        {
          id: 'search',
          name,
          description,
          toolDescription,
          icon: 'search.svg',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                title: 'Query',
                'x-i18n': localizedMeta
              }
            }
          },
          outputSchema: {}
        }
      ]
    });
    const legacyManifest = ToolManifestSchema.parse({
      ...manifestBase,
      type: 'tool',
      toolDescription: 'Legacy string description',
      children: [
        {
          id: 'legacy-search',
          name,
          description,
          toolDescription: 'Legacy child description',
          icon: 'legacy-search.svg',
          inputSchema: {},
          outputSchema: {}
        }
      ]
    });

    expect(manifest.description).toEqual(description);
    expect(manifest.toolDescription).toEqual(toolDescription);
    expect(manifest.children?.[0].toolDescription).toEqual(toolDescription);
    expect(manifest.children?.[0]?.inputSchema).toMatchObject({
      properties: {
        query: {
          title: 'Query',
          'x-i18n': localizedMeta
        }
      }
    });
    expect(legacyManifest.toolDescription).toBe('Legacy string description');
    expect(legacyManifest.children?.[0].toolDescription).toBe('Legacy child description');

    const tool = defineTool({
      manifest: {
        pluginId: 'localized-description-tool',
        name,
        description,
        version: '0.0.1',
        versionDescription: description,
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({
          query: z.string().meta({ description: 'Search public documentation' } satisfies InputSchemaMetaType)
        }),
        outputSchema: z.object({ result: z.string() }),
        handler: async () => ({ result: 'ok' })
      })
    });
    const childHandler = createToolHandler({
      inputSchema: z.object({
        query: z.string().meta({
          title: 'Child query',
          'x-i18n': localizedMeta
        } satisfies InputSchemaMetaType)
      }),
      outputSchema: z.object({
        result: z.string().meta({
          title: 'Child result',
          'x-i18n': localizedMeta
        } satisfies OutputSchemaMetaType)
      }),
      secretSchema: z.object({
        apiKey: z.string().meta({
          title: 'Child API key',
          description: 'Child API authentication key',
          isSecret: true,
          'x-i18n': localizedMeta
        } satisfies SecretSchemaMetaType)
      }),
      handler: async (input) => ({ result: input.query })
    });
    const childSecretSchema = childHandler.secretSchema ?? z.object();
    const toolSet = defineToolSet({
      manifest: {
        pluginId: 'localized-description-toolset',
        name,
        description,
        version: '0.0.1',
        versionDescription: description,
        tags: ['tools']
      },
      secretSchema: childSecretSchema,
      children: [
        {
          id: 'search',
          name,
          description,
          handler: childHandler
        }
      ]
    });

    const toolInputSchema = z.toJSONSchema(tool.getToolHandler().inputSchema) as JsonSchemaObject;
    const childInputSchema = z.toJSONSchema(childHandler.inputSchema) as JsonSchemaObject;
    const childOutputSchema = z.toJSONSchema(childHandler.outputSchema) as JsonSchemaObject;
    const childSecretJsonSchema = z.toJSONSchema(childSecretSchema) as JsonSchemaObject;

    expect(tool.getUserToolManifest().description).toEqual(description);
    expect(tool.getUserToolManifest()).not.toHaveProperty('toolDescription');
    expect(toolSet.getChildManifests()[0]).not.toHaveProperty('toolDescription');
    expect(toolInputSchema.properties?.query).toMatchObject({
      description: 'Search public documentation'
    });
    expect(toolInputSchema.properties?.query).not.toHaveProperty('toolDescription');
    expect(childInputSchema.properties?.query).toMatchObject({
      title: 'Child query',
      'x-i18n': localizedMeta
    });
    expect(childInputSchema.properties?.query).not.toHaveProperty('toolDescription');
    expect(childOutputSchema.properties?.result).toMatchObject({
      title: 'Child result',
      'x-i18n': localizedMeta
    });
    expect(childSecretJsonSchema.properties?.apiKey).toMatchObject({
      title: 'Child API key',
      description: 'Child API authentication key',
      isSecret: true,
      'x-i18n': localizedMeta
    });
  });
  it('retains runtime manifests and registrations with legacy descriptions', () => {
    const manifest = {
      pluginId: 'legacy-runtime-tool',
      name: { en: 'Search', 'zh-CN': '搜索' },
      description: { en: 'Canonical search', 'zh-CN': '唯一描述' },
      version: '1.0.0',
      toolDescription: 'Legacy root description',
      tags: ['tools' as const]
    };
    const handler = createToolHandler({
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.object({ result: z.string() }),
      handler: async () => ({ result: 'ok' })
    });
    handler.toolDescription = 'Legacy handler description';
    const tool = defineTool({ manifest, handler });
    const childManifest = {
      id: 'search',
      name: { en: 'Search', 'zh-CN': '搜索' },
      description: { en: 'Canonical child', 'zh-CN': '唯一子工具说明' },
      toolDescription: 'Legacy child description'
    };

    tool.registerTool(handler, 'search', childManifest);

    expect(tool.getUserToolManifest().description).toEqual({
      en: 'Canonical search',
      'zh-CN': '唯一描述'
    });
    expect(tool.getUserToolManifest().toolDescription).toBe('Legacy root description');
    expect(tool.getChildManifests()[0].toolDescription).toBe('Legacy child description');
    expect(tool.getChildManifests()[0]?.description).toEqual({
      en: 'Canonical child',
      'zh-CN': '唯一子工具说明'
    });
    expect(tool.getToolHandler('search')?.toolDescription).toBe('Legacy handler description');
    expect(tool.getToolHandler('search')?.handler).toBe(handler.handler);
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createStreamDataLike<T>() {
  const chunks: T[] = [];
  let closed = false;
  let notify: (() => void) | undefined;

  return {
    write(chunk: T): void {
      chunks.push(chunk);
      notify?.();
    },
    end(): void {
      closed = true;
      notify?.();
    },
    consume: async (consumer: (chunk: T) => void | Promise<void>): Promise<void> => {
      for await (const chunk of streamLikeValues()) {
        await consumer(chunk);
      }
    },
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return streamLikeValues()[Symbol.asyncIterator]();
    },
    values: streamLikeValues
  };

  async function* streamLikeValues(): AsyncGenerator<T, void, void> {
    let index = 0;
    while (true) {
      while (index < chunks.length) {
        yield chunks[index++]!;
      }
      if (closed) {
        return;
      }
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
      notify = undefined;
    }
  }
}

type JsonSchemaObject = {
  properties?: Record<string, unknown>;
};
