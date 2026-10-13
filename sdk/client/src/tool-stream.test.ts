import { describe, expect, it, vi } from 'vitest';

import { FastGPTPluginClient } from './client';

type FetchMock = ReturnType<typeof vi.fn>;

const createSseResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }

      const chunk = chunks[index];
      index += 1;
      controller.enqueue(encoder.encode(chunk));
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' }
  });
};

const createClient = (fetchMock: FetchMock) =>
  new FastGPTPluginClient({
    baseUrl: 'https://plugin.local',
    token: 'token',
    fetch: fetchMock as unknown as typeof globalThis.fetch
  });

const runParams = (overrides: Record<string, unknown> = {}) => ({
  input: {},
  pluginId: 'getTime',
  systemVar: {
    time: '2024-01-01T00:00:00.000Z',
    app: { id: 'test-app', name: 'Test App' },
    chat: { chatId: 'test-chat', uid: 'test-user' },
    invokeToken: ''
  },
  ...overrides
});

const responseEvent = (data: unknown) =>
  `data: ${JSON.stringify({ type: 'response', data })}\n\n`;

describe('FastGPTPluginClient tool stream', () => {
  it('passes legacy string content through the stream response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([responseEvent({ content: 'ordinary text', title: 'Result' })])
    );
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ content: 'ordinary text', title: 'Result' });
  });

  it('passes legacy object content through the stream response', async () => {
    const data = { content: { summary: 'done', items: 2 }, title: 'Result' };
    const fetchMock = vi.fn().mockResolvedValue(createSseResponse([responseEvent(data)]));
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(data);
  });

  it('passes legacy array content through the stream response', async () => {
    const data = { content: ['a.png', 'b.png'], title: 'Result' };
    const fetchMock = vi.fn().mockResolvedValue(createSseResponse([responseEvent(data)]));
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(data);
  });

  it('passes structured content parts through the stream response', async () => {
    const data = {
      content: [
        { type: 'text', text: 'Look at this image' },
        { type: 'image_url', image_url: { url: 'https://example.com/a.png' } }
      ]
    };
    const fetchMock = vi.fn().mockResolvedValue(createSseResponse([responseEvent(data)]));
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(data);
  });

  it('reassembles response events split across chunks', async () => {
    const payload = JSON.stringify({ type: 'response', data: { content: 'split text' } });
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        `data: ${payload.slice(0, 18)}`,
        `${payload.slice(18)}\n\n`
      ])
    );
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ content: 'split text' });
  });

  it('emits stream messages through onMessage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'data: {"type":"stream","data":{"type":"answer","content":"hello"}}\n\n',
        'data: {"type":"stream","data":{"type":"answer","content":" world"}}\n\n',
        responseEvent({ content: 'final text' })
      ])
    );
    const client = createClient(fetchMock);
    const onMessage = vi.fn();

    const result = await client.runToolStream(runParams({ onMessage }));

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ content: 'final text' });
    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenNthCalledWith(1, { type: 'answer', content: 'hello' });
    expect(onMessage).toHaveBeenNthCalledWith(2, { type: 'answer', content: ' world' });
  });

  it('skips malformed frames and keeps reading the stream', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse(['data: not-json\n\n', responseEvent({ content: 'still works' })])
    );
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ content: 'still works' });
  });

  it('skips frames that fail schema parsing and keeps reading the stream', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'data: {"type":"nope","data":{}}\n\n',
        responseEvent({ content: 'still works' })
      ])
    );
    const client = createClient(fetchMock);

    const result = await client.runToolStream(runParams());

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ content: 'still works' });
  });

  it('returns an error when the stream reports one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse(['data: {"type":"error","data":"something went wrong"}\n\n'])
    );
    const client = createClient(fetchMock);

    // runToolStream 的公开声明类型是 ToolHandlerReturnType,
    // 运行时实际返回 { output?, error? },这里按运行形状读取。
    const result = (await client.runToolStream(runParams())) as unknown as {
      output?: Record<string, unknown>;
      error?: Error;
    };

    expect(result.output).toBeUndefined();
    expect(result.error?.message).toBe('something went wrong');
  });
});
