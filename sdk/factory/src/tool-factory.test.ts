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
  type SecretSchemaMetaType
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
          toolDescription: 'Search query',
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
      toolDescription: 'Search query',
      isToolParam: true,
      'x-i18n': {
        title: localized,
        description: localized,
        placeholder: localized
      }
    });
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

  it('accepts localized model descriptions for tools, children, and input parameters', () => {
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

    expect(manifest.toolDescription).toEqual(toolDescription);
    expect(manifest.children?.[0]?.toolDescription).toEqual(toolDescription);
    expect(manifest.children?.[0]?.inputSchema).toMatchObject({
      properties: {
        query: {
          title: 'Query',
          'x-i18n': localizedMeta
        }
      }
    });
    expect(legacyManifest.toolDescription).toBe('Legacy string description');
    expect(legacyManifest.children?.[0]?.toolDescription).toBe('Legacy child description');

    const tool = defineTool({
      manifest: {
        pluginId: 'localized-description-tool',
        name,
        description,
        version: '0.0.1',
        versionDescription: description,
        tags: ['tools'],
        toolDescription
      },
      handler: createToolHandler({
        inputSchema: z.object({
          query: z.string().meta({ toolDescription } satisfies InputSchemaMetaType)
        }),
        outputSchema: z.object({ result: z.string() }),
        handler: async () => ({ result: 'ok' })
      })
    });
    const childHandler = createToolHandler({
      inputSchema: z.object({
        query: z.string().meta({
          title: 'Child query',
          toolDescription,
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
          toolDescription,
          handler: childHandler
        }
      ]
    });

    const toolInputSchema = z.toJSONSchema(tool.getToolHandler().inputSchema) as JsonSchemaObject;
    const childInputSchema = z.toJSONSchema(childHandler.inputSchema) as JsonSchemaObject;
    const childOutputSchema = z.toJSONSchema(childHandler.outputSchema) as JsonSchemaObject;
    const childSecretJsonSchema = z.toJSONSchema(childSecretSchema) as JsonSchemaObject;

    expect(tool.getUserToolManifest().toolDescription).toEqual(toolDescription);
    expect(toolSet.getChildManifests()[0]?.toolDescription).toEqual(toolDescription);
    expect(toolInputSchema.properties?.query).toMatchObject({
      toolDescription
    });
    expect(childInputSchema.properties?.query).toMatchObject({
      title: 'Child query',
      toolDescription,
      'x-i18n': localizedMeta
    });
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
