import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import z from 'zod';

import {
  type InvokeChatCompletionReplyMetaType,
  InvokeMethodEnum
} from '@domain/ports/invoke.port';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { PluginChannelClientMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';

import {
  createLocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from '../../../apps/cli/src/debug/runtime';

import {
  createToolHandler,
  defineInputSchema,
  defineOutputSchema,
  defineTool,
  Model
} from './index';
import { InvokeClient } from './invoke.client';
import type { PluginRuntimeChannel } from './runtime-channel.type';

describe('InvokeClient.chatCompletion & createModelClient', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;

  afterEach(() => {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  });

  it('returns an authentic OpenAI instance from createModelClient()', () => {
    const channel = createMockChannel(vi.fn());
    const invokeClient = new InvokeClient(channel, { invocationId: 'trace-instance' });

    const client = invokeClient.createModelClient();

    expect(client).toBeInstanceOf(OpenAI);
    expectTypeOf(client).toEqualTypeOf<OpenAI>();
  });

  it('proxies non-streaming chat.completions.create over channel.request and returns standard ChatCompletion', async () => {
    const requestMock = vi.fn(async () => ({
      requestId: 'req-1',
      result: successResult({
        status: 200,
        headers: {
          'content-length': '999999',
          'content-encoding': 'gzip',
          'x-request-id': 'fastgpt-req-1'
        },
        body: {
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1700000000,
          model: 'model-id-1',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello from FastGPT!'
              },
              finish_reason: 'stop',
              logprobs: null
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
          }
        }
      })
    }));

    const invokeClient = new InvokeClient(createMockChannel(requestMock), {
      invocationId: 'trace-non-stream'
    });
    const client = invokeClient.createModelClient();

    const completion = await client.chat.completions.create({
      model: 'model-id-1',
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.3
    });

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith(
      PluginChannelClientMethod.request,
      {
        method: InvokeMethodEnum.chatCompletion,
        args: {
          body: {
            model: 'model-id-1',
            messages: [{ role: 'user', content: 'Hi' }],
            temperature: 0.3
          }
        }
      },
      {
        traceId: 'trace-non-stream'
      }
    );

    expect(completion.id).toBe('chatcmpl-123');
    expect(completion.choices[0]?.message.content).toBe('Hello from FastGPT!');
    expect(completion.usage?.total_tokens).toBe(15);
  });

  it('forwards sanitized custom non-auth headers while stripping auth headers', async () => {
    const requestMock = vi.fn(async () => ({
      requestId: 'req-headers',
      result: successResult({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: {
          id: 'chatcmpl-headers',
          object: 'chat.completion',
          created: 1700000000,
          model: 'model-id-1',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'ok' },
              finish_reason: 'stop',
              logprobs: null
            }
          ]
        }
      })
    }));

    const invokeClient = new InvokeClient(createMockChannel(requestMock), {
      invocationId: 'trace-headers'
    });
    const client = invokeClient.createModelClient();

    await client.chat.completions.create(
      {
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'check headers' }]
      },
      {
        headers: {
          Authorization: 'Bearer attacker-token',
          'X-Trace-Context': 'ctx-42'
        }
      }
    );

    expect(requestMock).toHaveBeenCalledWith(
      PluginChannelClientMethod.request,
      {
        method: InvokeMethodEnum.chatCompletion,
        args: {
          body: {
            model: 'model-id-1',
            messages: [{ role: 'user', content: 'check headers' }]
          },
          headers: {
            'x-trace-context': 'ctx-42'
          }
        }
      },
      {
        traceId: 'trace-headers'
      }
    );
  });

  it('streams ChatCompletionChunk items for Uint8Array, string, and serialized Buffer chunks', async () => {
    const encoder = new TextEncoder();
    const sseStream = StreamData.create<unknown>();

    const requestMock = vi.fn(async () => {
      queueMicrotask(() => {
        sseStream.write(
          encoder.encode(
            'data: {"id":"chatcmpl-stream","object":"chat.completion.chunk","created":1700000001,"model":"model-id-1","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello "},"finish_reason":null}]}\n\n'
          )
        );
        sseStream.write(
          'data: {"id":"chatcmpl-stream","object":"chat.completion.chunk","created":1700000001,"model":"model-id-1","choices":[{"index":0,"delta":{"content":"world"},"finish_reason":null}]}\n\n'
        );
        const finalBytes = Array.from(
          Buffer.from(
            'data: {"id":"chatcmpl-stream","object":"chat.completion.chunk","created":1700000001,"model":"model-id-1","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
            'utf8'
          )
        );
        sseStream.write({ type: 'Buffer', data: finalBytes });
        sseStream.end();
      });

      return {
        requestId: 'req-stream',
        result: successResult<InvokeChatCompletionReplyMetaType>({
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        }),
        output: {
          streamId: 'stream-1',
          streamName: 'request.output:req-stream',
          stream: sseStream
        }
      };
    });

    const invokeClient = new InvokeClient(createMockChannel(requestMock), {
      invocationId: 'trace-stream'
    });
    const client = invokeClient.createModelClient();

    const stream = await client.chat.completions.create({
      model: 'model-id-1',
      messages: [{ role: 'user', content: 'Stream please' }],
      stream: true
    });

    const chunks: ChatCompletionChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.choices[0]?.delta?.content ?? '').join('')).toBe('Hello world!');
    expect(chunks[2]?.choices[0]?.finish_reason).toBe('stop');
  });

  it('raises OpenAI.APIError with matching status and message on FastGPT HTTP 400 and 403 errors', async () => {
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({
        requestId: 'req-400',
        result: successResult({
          status: 400,
          headers: { 'content-type': 'application/json' },
          body: {
            error: {
              message: 'Model not found or disabled',
              type: 'invalid_request_error'
            }
          }
        })
      })
      .mockResolvedValueOnce({
        requestId: 'req-403',
        result: successResult({
          status: 403,
          headers: { 'content-type': 'application/json' },
          body: {
            error: {
              message: 'Team does not have access to model-secret',
              type: 'permission_error'
            }
          }
        })
      });

    const invokeClient = new InvokeClient(createMockChannel(requestMock), {
      invocationId: 'trace-http-err'
    });
    const client = invokeClient.createModelClient();

    await expect(
      client.chat.completions.create({
        model: 'disabled-model',
        messages: [{ role: 'user', content: 'hello' }]
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(OpenAI.APIError);
      expect(error).toBeInstanceOf(OpenAI.BadRequestError);
      const apiErr = error as InstanceType<typeof OpenAI.APIError>;
      expect(apiErr.status).toBe(400);
      expect(apiErr.message).toContain('Model not found or disabled');
      return true;
    });

    await expect(
      client.chat.completions.create({
        model: 'model-secret',
        messages: [{ role: 'user', content: 'hello' }]
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(OpenAI.APIError);
      expect(error).toBeInstanceOf(OpenAI.PermissionDeniedError);
      const apiErr = error as InstanceType<typeof OpenAI.APIError>;
      expect(apiErr.status).toBe(403);
      expect(apiErr.message).toContain('Team does not have access to model-secret');
      return true;
    });

    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces a clear non-retried error when channel returns failureResult (e.g. missing model:invoke permission)', async () => {
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({
        requestId: 'req-perm',
        result: failureResult(
          {
            en: 'Plugin permission "model:invoke" is required',
            'zh-CN': '插件需要 "model:invoke" 权限'
          },
          null
        )
      })
      .mockRejectedValueOnce(new Error('IPC channel disconnected'));

    const invokeClient = new InvokeClient(createMockChannel(requestMock), {
      invocationId: 'trace-channel-err'
    });
    const client = invokeClient.createModelClient();

    await expect(
      client.chat.completions.create({
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'hello' }]
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(OpenAI.APIError);
      const apiErr = error as InstanceType<typeof OpenAI.APIError>;
      expect(apiErr.status).toBe(403);
      expect(apiErr.message).toContain('model:invoke');
      return true;
    });

    await expect(
      client.chat.completions.create({
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'hello' }]
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(OpenAI.APIError);
      const apiErr = error as InstanceType<typeof OpenAI.APIError>;
      expect(apiErr.status).toBe(502);
      expect(apiErr.message).toContain('IPC channel disconnected');
      return true;
    });

    // Neither failure should be retried by OpenAI SDK
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('rejects non-chat-completion OpenAI endpoints cleanly without calling channel.request', async () => {
    const requestMock = vi.fn();
    const invokeClient = new InvokeClient(createMockChannel(requestMock));
    const client = invokeClient.createModelClient();

    await expect(client.models.list()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(OpenAI.NotFoundError);
      expect((error as InstanceType<typeof OpenAI.APIError>).status).toBe(404);
      return true;
    });

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('aborts cleanly via AbortSignal before request, during request, and mid-stream without unhandled rejections', async () => {
    const unhandled: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandledRejection);

    try {
      // 1. Pre-aborted signal
      const preAbortController = new AbortController();
      preAbortController.abort();
      const preAbortRequestMock = vi.fn();
      const preAbortClient = new InvokeClient(
        createMockChannel(preAbortRequestMock)
      ).createModelClient();

      await expect(
        preAbortClient.chat.completions.create(
          {
            model: 'model-id-1',
            messages: [{ role: 'user', content: 'hi' }]
          },
          { signal: preAbortController.signal }
        )
      ).rejects.toThrow();
      expect(preAbortRequestMock).not.toHaveBeenCalled();

      // 2. Aborted while channel.request is pending
      const inFlightController = new AbortController();
      let resolvePendingRequest!: (value: unknown) => void;
      const lateStream = StreamData.create<Uint8Array>();
      const inFlightRequestMock = vi.fn(
        () =>
          new Promise((resolve) => {
            resolvePendingRequest = resolve;
          })
      );
      const inFlightClient = new InvokeClient(
        createMockChannel(inFlightRequestMock)
      ).createModelClient();

      const pendingCall = inFlightClient.chat.completions.create(
        {
          model: 'model-id-1',
          messages: [{ role: 'user', content: 'hi' }]
        },
        { signal: inFlightController.signal }
      );
      setTimeout(() => {
        inFlightController.abort();
      }, 10);

      await expect(pendingCall).rejects.toBeInstanceOf(OpenAI.APIUserAbortError);

      // Resolve the late channel request with an incoming stream to ensure it is destroyed cleanly
      resolvePendingRequest({
        requestId: 'req-late',
        result: successResult<InvokeChatCompletionReplyMetaType>({
          status: 200,
          headers: { 'content-type': 'text/event-stream' }
        }),
        output: {
          streamId: 'late-stream',
          streamName: 'request.output:req-late',
          stream: lateStream
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(lateStream.toReadable().destroyed).toBe(true);

      // 3. Aborted mid-SSE-stream
      const streamAbortController = new AbortController();
      const activeStream = StreamData.create<Uint8Array>();
      const encoder = new TextEncoder();

      const midStreamRequestMock = vi.fn(async () => {
        queueMicrotask(() => {
          activeStream.write(
            encoder.encode(
              'data: {"id":"chatcmpl-abort","object":"chat.completion.chunk","created":1700000002,"model":"model-id-1","choices":[{"index":0,"delta":{"content":"First"},"finish_reason":null}]}\n\n'
            )
          );
        });

        return {
          requestId: 'req-mid-abort',
          result: successResult<InvokeChatCompletionReplyMetaType>({
            status: 200,
            headers: { 'content-type': 'text/event-stream' }
          }),
          output: {
            streamId: 'mid-stream',
            streamName: 'request.output:req-mid-abort',
            stream: activeStream
          }
        };
      });

      const midStreamClient = new InvokeClient(
        createMockChannel(midStreamRequestMock)
      ).createModelClient();

      const sse = await midStreamClient.chat.completions.create(
        {
          model: 'model-id-1',
          messages: [{ role: 'user', content: 'stream and abort' }],
          stream: true
        },
        { signal: streamAbortController.signal }
      );

      const received: string[] = [];
      for await (const chunk of sse) {
        received.push(chunk.choices[0]?.delta?.content ?? '');
        streamAbortController.abort();
      }

      expect(sse.controller.signal.aborted).toBe(true);
      expect(received).toEqual(['First']);
      expect(activeStream.toReadable().destroyed).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }
  });

  it('integrates with defineTool and ctx.invoke.createModelClient() end-to-end over LocalDebugRuntime', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineTool({
      manifest: {
        pluginId: 'model-invoke-tool',
        name: { en: 'Model Invoke Tool', 'zh-CN': '模型调用工具' },
        description: { en: 'Summarizes text', 'zh-CN': '总结文本' },
        version: '0.0.1',
        versionDescription: { en: 'Init', 'zh-CN': '初始版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: defineInputSchema({
          model: {
            type: Model,
            title: { en: 'Model', 'zh-CN': '模型' }
          },
          prompt: {
            type: z.string(),
            title: { en: 'Prompt', 'zh-CN': '提示词' }
          }
        }),
        outputSchema: defineOutputSchema({
          summary: {
            type: z.string(),
            title: { en: 'Summary', 'zh-CN': '摘要' }
          }
        }),
        handler: async (input, ctx) => {
          const ai = ctx.invoke.createModelClient();
          const res = await ai.chat.completions.create({
            model: input.model,
            messages: [{ role: 'user', content: input.prompt }]
          });

          return {
            summary: res.choices[0]?.message.content ?? ''
          };
        }
      })
    });

    runtime.setHostRequestHandler(({ method, args, traceId }) => {
      expect(method).toBe(InvokeMethodEnum.chatCompletion);
      expect(traceId).toBe('tool-trace-1');
      expect(args).toEqual({
        body: {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Summarize FastGPT' }]
        }
      });

      return successResult({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: {
          id: 'chatcmpl-tool-1',
          object: 'chat.completion',
          created: 1700000005,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'FastGPT summary output' },
              finish_reason: 'stop',
              logprobs: null
            }
          ]
        }
      });
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      {
        input: { model: string; prompt: string };
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      PluginStreamMessageType
    >(
      'run',
      {
        input: {
          model: 'gpt-4o-mini',
          prompt: 'Summarize FastGPT'
        },
        systemVar: {}
      },
      { traceId: 'tool-trace-1' }
    );

    const messages: PluginStreamMessageType[] = [];
    await response.output!.stream.consume((chunk) => {
      messages.push(chunk);
    });

    expect(messages).toEqual([
      {
        type: 'response',
        data: {
          summary: 'FastGPT summary output'
        }
      }
    ]);
  });
});

function createMockChannel(requestFn: ReturnType<typeof vi.fn>): PluginRuntimeChannel {
  return {
    transport: 'local-debug',
    side: 'client',
    request: requestFn as unknown as PluginRuntimeChannel['request'],
    notify: vi.fn(),
    setRequestHandler: vi.fn(),
    setNotificationHandler: vi.fn(),
    waitForStream: vi.fn(),
    createWritableStream: vi.fn(),
    pipeStream: vi.fn(),
    createReply: vi.fn(),
    onError: vi.fn(() => () => {}),
    onClose: vi.fn(() => () => {}),
    close: vi.fn()
  };
}
