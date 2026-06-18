import { describe, expect, it, vi } from 'vitest';

import { FCFunctionInvoker, parseFCInvokeFrames } from './fc-function-invoker';

describe('FCFunctionInvoker', () => {
  it('parses NDJSON frames', () => {
    expect(
      parseFCInvokeFrames(
        [
          JSON.stringify({ type: 'stream', data: { type: 'answer', content: 'a' } }),
          JSON.stringify({ type: 'response', data: { ok: true } })
        ].join('\n')
      )
    ).toEqual([
      { type: 'stream', data: { type: 'answer', content: 'a' } },
      { type: 'response', data: { ok: true } }
    ]);
  });

  it('turns buffered frames into StreamData', async () => {
    const provider = {
      invoke: vi.fn(async () => ({
        frames: [
          { type: 'stream', data: { type: 'answer', content: 'hello' } },
          { type: 'response', data: { ok: true } }
        ]
      }))
    };
    const invoker = new FCFunctionInvoker({ provider: provider as any });

    const stream = await invoker.invoke({
      functionName: 'fn',
      runtimeId: 'runtime',
      eventName: 'run',
      payload: {},
      returnStream: true,
      timeoutMs: 1000,
      invocationMode: 'openapi-buffered'
    });
    const messages: unknown[] = [];
    await stream.consume((message) => {
      messages.push(message);
    });

    expect(messages).toEqual([
      { type: 'stream', data: { type: 'answer', content: 'hello' } },
      { type: 'response', data: { ok: true } }
    ]);
  });
});
