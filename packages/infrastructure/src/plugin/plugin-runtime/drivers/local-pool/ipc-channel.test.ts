import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';

import { StreamData } from '@domain/value-objects/stream.vo';
import { afterEach, describe, expect, it } from 'vitest';

import { PluginIpcChannel } from './ipc-channel';

class MemoryIpcEndpoint extends EventEmitter {
  peer?: MemoryIpcEndpoint;

  send(message: unknown, callback?: (error: Error | null | undefined) => void): boolean {
    setImmediate(() => {
      this.peer?.emit('message', message);
      callback?.(null);
    });
    return true;
  }
}

function createChannelPair() {
  const leftEndpoint = new MemoryIpcEndpoint();
  const rightEndpoint = new MemoryIpcEndpoint();
  leftEndpoint.peer = rightEndpoint;
  rightEndpoint.peer = leftEndpoint;

  const left = new PluginIpcChannel(leftEndpoint as unknown as ChildProcess, {
    defaultTimeoutMs: 500
  });
  const right = new PluginIpcChannel(rightEndpoint as unknown as ChildProcess, {
    defaultTimeoutMs: 500
  });

  return {
    left,
    right,
    close: async () => {
      await Promise.all([left.close(), right.close()]);
    }
  };
}

async function collectStream<T>(stream: StreamData<T>): Promise<T[]> {
  const chunks: T[] = [];
  await stream.consume((chunk) => {
    chunks.push(chunk);
  });
  return chunks;
}

const channelPairs: Array<ReturnType<typeof createChannelPair>> = [];

describe('PluginIpcChannel', () => {
  afterEach(async () => {
    await Promise.allSettled(channelPairs.splice(0).map((pair) => pair.close()));
  });

  it('sends a request and resolves the matching response', async () => {
    const pair = createChannelPair();
    channelPairs.push(pair);

    pair.right.setRequestHandler(async (message) => ({
      method: message.method,
      params: message.params,
      traceId: message.traceId
    }));

    await expect(
      pair.left.request('echo', { text: 'hello' }, { traceId: 'trace-1' })
    ).resolves.toEqual({
      method: 'echo',
      params: { text: 'hello' },
      traceId: 'trace-1'
    });
  });

  it('normalizes handler errors into rejected requests', async () => {
    const pair = createChannelPair();
    channelPairs.push(pair);

    pair.right.setRequestHandler(async () => {
      throw Object.assign(new Error('boom'), { code: 'BOOM' });
    });

    await expect(pair.left.request('explode', {})).rejects.toMatchObject({
      code: 'BOOM',
      message: 'boom'
    });
  });

  it('pipes duplex input and output streams through request/reply', async () => {
    const pair = createChannelPair();
    channelPairs.push(pair);

    pair.right.setRequestHandler(async (message) => {
      const input = await pair.right.waitForRequestInputStream<string>(message, {
        timeoutMs: 500
      });
      const received = await collectStream(input.stream);
      const output = StreamData.create<string>((stream) => {
        for (const chunk of received) {
          stream.write(`${chunk}!`);
        }
        stream.close();
      });

      return pair.right.replyDuplex(
        message,
        {
          received,
          inputMeta: input.meta
        },
        {
          output,
          outputMeta: { direction: 'out' }
        }
      );
    });

    const input = StreamData.create<string>((stream) => {
      stream.write('a');
      stream.write('b');
      stream.close();
    });

    const response = await pair.left.requestDuplex<
      Record<string, never>,
      { received: string[]; inputMeta: unknown },
      string,
      string
    >(
      'duplex',
      {},
      {
        input,
        inputMeta: { direction: 'in' },
        timeoutMs: 1000
      }
    );

    await response.inputDone;

    expect(response.result).toEqual({
      received: ['a', 'b'],
      inputMeta: { direction: 'in' }
    });
    expect(response.output?.meta).toEqual({ direction: 'out' });
    await expect(collectStream(response.output!.stream)).resolves.toEqual(['a!', 'b!']);
  });

  it('buffers a stream until a waiter asks for it', async () => {
    const pair = createChannelPair();
    channelPairs.push(pair);

    const writable = await pair.left.createWritableStream<number>('metrics', {
      traceId: 'trace-stream',
      meta: { source: 'unit-test' }
    });
    await writable.write(1);
    await writable.write(2);
    await writable.end();

    const incoming = await pair.right.waitForStream<number>('metrics', { timeoutMs: 500 });

    expect(incoming.traceId).toBe('trace-stream');
    expect(incoming.meta).toEqual({ source: 'unit-test' });
    await expect(collectStream(incoming.stream)).resolves.toEqual([1, 2]);
  });
});
