import '@infrastructure/errors/error.registry';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import { ConnectionGatewayDebugRuntimeManager } from './debug-runtime.driver';

describe('ConnectionGatewayDebugRuntimeManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes a debug session through gateway response streams', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            session: {
              id: 'session-a',
              consumerType: 'plugin-debug',
              generation: 0,
              status: 'connected'
            }
          },
          ownerAlive: true
        })
      )
      .mockResolvedValueOnce(
        ndjsonResponse([
          {
            protocol: 'connection-gateway.v1',
            sessionId: 'session-a',
            generation: 0,
            requestId: 'invoke-a',
            type: 'response',
            consumerType: 'plugin-debug',
            capability: 'invoke',
            createdAt: Date.now(),
            payload: { kind: 'plugin-debug.accepted' }
          },
          {
            protocol: 'connection-gateway.v1',
            sessionId: 'session-a',
            generation: 0,
            requestId: 'invoke-a',
            type: 'stream',
            consumerType: 'plugin-debug',
            capability: 'invoke',
            createdAt: Date.now(),
            payload: {
              kind: 'plugin-debug.stream',
              event: 'chunk',
              data: { type: 'response', data: { time: 'now' } }
            }
          },
          {
            protocol: 'connection-gateway.v1',
            sessionId: 'session-a',
            generation: 0,
            requestId: 'invoke-a',
            type: 'stream',
            consumerType: 'plugin-debug',
            capability: 'invoke',
            createdAt: Date.now(),
            payload: {
              kind: 'plugin-debug.stream',
              event: 'end'
            }
          }
        ])
      );
    const manager = new ConnectionGatewayDebugRuntimeManager({
      baseUrl: 'http://gateway.local',
      authToken: 'token',
      requestTimeoutMs: 1_000,
      sourceForTmbId: ({ tmbId }) => `debug:tmbId:${tmbId}`,
      sourceForUser: ({ userId }) => `debug:user:${userId}`
    });

    const [stream, err] = await manager.invoke<ToolStreamMessageType, true>({
      uniqueId: {
        pluginId: 'getTime',
        version: '1.0.0',
        etag: 'debug'
      },
      eventName: 'run',
      payload: {
        input: {},
        systemVar: {
          app: { id: 'app', name: 'app' },
          chat: { chatId: 'chat' },
          invokeToken: 'token',
          time: 'now'
        }
      },
      returnStream: true,
      options: {
        invocationId: 'invoke-a',
        debug: {
          userId: 'u1'
        }
      }
    });

    expect(err).toBeNull();
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://gateway.local/internal/sessions/by-source/debug%3Auser%3Au1/status',
      expect.any(Object)
    );
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1]?.[1]?.body as string)).toMatchObject({
      envelope: {
        payload: {
          payload: {
            pluginId: 'getTime',
            source: 'debug:user:u1'
          }
        }
      }
    });
    const messages: ToolStreamMessageType[] = [];
    await stream?.consume((message) => {
      messages.push(message);
    });
    expect(messages).toEqual([{ type: 'response', data: { time: 'now' } }]);
  });
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function ndjsonResponse(payloads: unknown[]): Response {
  return new Response(payloads.map((payload) => JSON.stringify(payload)).join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson'
    }
  });
}
