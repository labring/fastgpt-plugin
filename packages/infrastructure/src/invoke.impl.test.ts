import { Readable } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InvokeUploadFileInputType } from '@domain/ports/invoke.port';
import { StreamData } from '@domain/value-objects/stream.vo';

import { InvokeManager } from './plugin/invoke/invoke.impl';

type TestableInvokeManager = {
  buildUploadFileRequest(input: InvokeUploadFileInputType): Promise<{ formData: FormData }>;
};

describe('InvokeManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('restores JSON-serialized Buffer chunks before building upload FormData', async () => {
    const manager = new InvokeManager({
      token: 'token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    }) as unknown as TestableInvokeManager;

    const request = await manager.buildUploadFileRequest({
      file: Readable.from([{ type: 'Buffer', data: [...Buffer.from('hello')] }], {
        objectMode: true
      }),
      fileName: 'hello.txt',
      contentType: 'text/plain'
    });

    const file = request.formData.get('file');

    expect(file).toBeInstanceOf(Blob);
    expect(await (file as Blob).text()).toBe('hello');
  });

  it('proxies non-streaming JSON chatCompletion responses with bearer auth', async () => {
    const completionPayload = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1700000000,
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Hello from FastGPT' },
          finish_reason: 'stop'
        }
      ]
    };
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify(completionPayload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': 'req-json-1'
          }
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const [result, err] = await manager.chatCompletion({
      body: {
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false
      },
      headers: {
        Authorization: 'Bearer spoofed-token',
        'x-stainless-lang': 'js'
      }
    });

    expect(err).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0]!;
    expect(requestUrl).toBe('https://fastgpt.example.com/api/invoke/llm/chat/completions');
    expect(requestInit?.method).toBe('POST');
    const sentHeaders = requestInit?.headers as Headers;
    expect(sentHeaders.get('Authorization')).toBe('Bearer invoke-jwt-token');
    expect(sentHeaders.get('Content-Type')).toBe('application/json');
    expect(sentHeaders.get('x-stainless-lang')).toBe('js');
    expect(JSON.parse(requestInit?.body as string)).toEqual({
      model: 'model-id-1',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: false
    });

    expect(result).toEqual({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/json',
        'x-request-id': 'req-json-1'
      }),
      body: completionPayload
    });
  });

  it('bridges SSE text/event-stream responses into StreamData chunks', async () => {
    const encoder = new TextEncoder();
    const sseFrames = [
      'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"lo"}}]}\n\n',
      'data: [DONE]\n\n'
    ];
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of sseFrames) {
          controller.enqueue(encoder.encode(frame));
        }
        controller.close();
      }
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(webStream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8'
          }
        })
      )
    );

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const [result, err] = await manager.chatCompletion({
      body: {
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true
      }
    });

    expect(err).toBeNull();
    expect(result?.status).toBe(200);
    expect(result?.headers['content-type']).toContain('text/event-stream');
    expect(result?.stream).toBeInstanceOf(StreamData);

    const received: string[] = [];
    const decoder = new TextDecoder();
    for await (const chunk of (result!.stream as StreamData<Uint8Array>).values()) {
      received.push(typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }));
    }
    received.push(decoder.decode());

    expect(received.join('')).toBe(sseFrames.join(''));
  });

  it('cancels the upstream SSE ReadableStream cleanly when the output stream is destroyed early', async () => {
    let cancelCalled = false;
    const encoder = new TextEncoder();
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"first"}}]}\n\n'));
      },
      cancel() {
        cancelCalled = true;
      }
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(webStream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream'
          }
        })
      )
    );

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const [result, err] = await manager.chatCompletion({
      body: {
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true
      }
    });

    expect(err).toBeNull();
    const stream = result!.stream as StreamData<Uint8Array>;
    stream.toReadable().destroy();

    await vi.waitFor(() => {
      expect(cancelCalled).toBe(true);
    });
  });

  it('passes through 4xx HTTP error status, headers, and body without converting to failureResult', async () => {
    const errorBody = {
      error: {
        message: 'Model not found or disabled',
        type: 'invalid_request_error',
        code: 'model_not_found'
      }
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(errorBody), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
    );

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const [result, err] = await manager.chatCompletion({
      body: {
        model: 'unauthorized-model',
        messages: [{ role: 'user', content: 'Hi' }]
      }
    });

    expect(err).toBeNull();
    expect(result).toEqual({
      status: 403,
      headers: expect.objectContaining({
        'content-type': 'application/json'
      }),
      body: errorBody
    });
  });

  it('returns failureResult when fetch rejects due to network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const [result, err] = await manager.chatCompletion({
      body: {
        model: 'model-id-1',
        messages: [{ role: 'user', content: 'Hi' }]
      }
    });

    expect(result).toBeNull();
    expect(err).toMatchObject({
      reason: {
        en: 'Invoke chat completion failed',
        'zh-CN': '反向调用模型对话失败'
      }
    });
  });

  it('forwards AbortSignal to fetch and cancels active SSE stream when aborted', async () => {
    let cancelCalled = false;
    let receivedSignal: AbortSignal | undefined;
    const encoder = new TextEncoder();

    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"id":"chunk-1"}\n\n'));
      },
      cancel() {
        cancelCalled = true;
      }
    });

    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream'
        }
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const manager = new InvokeManager({
      token: 'invoke-jwt-token',
      fastgptBaseUrl: 'https://fastgpt.example.com'
    });

    const abortController = new AbortController();
    const [result, err] = await manager.chatCompletion(
      {
        body: {
          model: 'model-id-1',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: true
        }
      },
      { signal: abortController.signal }
    );

    expect(err).toBeNull();
    expect(receivedSignal).toBe(abortController.signal);
    const stream = result!.stream as StreamData<Uint8Array>;
    expect(stream.toReadable().destroyed).toBe(false);

    abortController.abort();

    await vi.waitFor(() => {
      expect(cancelCalled).toBe(true);
      expect(stream.toReadable().destroyed).toBe(true);
    });
  });
});
