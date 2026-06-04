import { EventEmitter } from 'node:events';

import { describe, expect, it } from 'vitest';

import { createError, RegisteredError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { PluginChannelHostMethod } from '../../ports/channel';

import { PluginIpcRuntimeChannel } from './ipc';

class FakeEndpoint extends EventEmitter {
  peer?: FakeEndpoint;

  send(message: unknown, callback?: (error: Error | null) => void): boolean {
    queueMicrotask(() => {
      this.peer?.emit('message', message);
      callback?.(null);
    });
    return true;
  }
}

function createChannelPair() {
  const hostEndpoint = new FakeEndpoint();
  const clientEndpoint = new FakeEndpoint();
  hostEndpoint.peer = clientEndpoint;
  clientEndpoint.peer = hostEndpoint;

  return {
    host: new PluginIpcRuntimeChannel('host', hostEndpoint as never),
    client: new PluginIpcRuntimeChannel('client', clientEndpoint as never)
  };
}

describe('PluginIpcRuntimeChannel errors', () => {
  it('round-trips registered errors with cause through request failures', async () => {
    const { host, client } = createChannelPair();
    const cause = Object.assign(new Error('Request timeout: run'), {
      code: 'REQUEST_TIMEOUT',
      data: { timeoutMs: 1000 }
    });

    client.setRequestHandler(() => {
      throw createError(ErrorCode.pluginInvokeTimeout, {
        cause,
        data: { method: 'run' }
      });
    });

    await expect(
      host.request(PluginChannelHostMethod.request, {
        eventName: 'run',
        payload: {}
      })
    ).rejects.toMatchObject({
      code: ErrorCode.pluginInvokeTimeout,
      data: { method: 'run' },
      cause: expect.objectContaining({
        message: 'Request timeout: run',
        code: 'REQUEST_TIMEOUT'
      })
    });

    try {
      await host.request(PluginChannelHostMethod.request, {
        eventName: 'run',
        payload: {}
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RegisteredError);
      expect((error as Error).cause).toBeInstanceOf(Error);
    }

    await host.close();
    await client.close();
  });
});
