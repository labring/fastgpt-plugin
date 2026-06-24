import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConnectionGatewayWsServerMessage } from '@domain/value-objects/connection-gateway.vo';

import { connectDebugGateway } from './gateway';

describe('connectDebugGateway', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('binds a WSS connection with the scoped connect token', async () => {
    const socket = new FakeWebSocket();
    vi.stubGlobal('WebSocket', makeWebSocketConstructor(socket));

    const clientPromise = connectDebugGateway({
      targets: [makeTarget()],
      options: makeOptions()
    });

    socket.open();
    await vi.waitFor(() => {
      expect(socket.sent).toHaveLength(1);
    });
    const bind = socket.sent[0] as Record<string, unknown>;
    expect(bind).toMatchObject({
      protocol: 'connection-gateway.ws.v1',
      type: 'bind',
      token: 'scoped-token',
      metadata: {
        pluginDebug: {
          targets: [
            expect.objectContaining({
              source: 'debug:tmbId:tmb-1',
              pluginId: 'getTime'
            })
          ]
        }
      }
    });

    socket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: bind.requestId as string,
      session: makeSession()
    });
    const client = await clientPromise;

    expect(client.session.id).toBe('session-a');
    client.close();
    await client.closed;
    expect(socket.closed).toBe(true);
  });

  it('handles gateway request envelopes over WSS', async () => {
    const socket = new FakeWebSocket();
    vi.stubGlobal('WebSocket', makeWebSocketConstructor(socket));

    const clientPromise = connectDebugGateway({
      targets: [makeTarget()],
      options: makeOptions()
    });

    socket.open();
    await vi.waitFor(() => {
      expect(socket.sent).toHaveLength(1);
    });
    socket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (socket.sent[0] as { requestId: string }).requestId,
      session: makeSession()
    });
    const client = await clientPromise;

    socket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'envelope',
      envelope: {
        protocol: 'connection-gateway.v1',
        sessionId: 'session-a',
        generation: 0,
        requestId: 'request-a',
        type: 'request',
        consumerType: 'plugin-debug',
        capability: 'invoke',
        createdAt: Date.now(),
        payload: {
          kind: 'plugin-debug.run',
          eventName: 'run',
          payload: {
            pluginId: 'getTime',
            childId: '',
            input: {},
            systemVar: makeSystemVar()
          }
        }
      }
    });

    await vi.waitFor(() => {
      expect(socket.sent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'envelope',
            envelope: expect.objectContaining({
              type: 'response',
              requestId: 'request-a',
              payload: {
                kind: 'plugin-debug.accepted'
              }
            })
          }),
          expect.objectContaining({
            type: 'envelope',
            envelope: expect.objectContaining({
              type: 'stream',
              requestId: 'request-a',
              payload: {
                kind: 'plugin-debug.stream',
                event: 'end'
              }
            })
          })
        ])
      );
    });

    client.close();
    await client.closed;
  });
});

class FakeWebSocket extends EventTarget {
  static OPEN = 1;
  readonly sent: unknown[] = [];
  readyState = 0;
  closed = false;
  private static readonly OPEN_STATE = 1;
  private static readonly CLOSED_STATE = 3;

  constructor(readonly url = 'wss://gateway.example.com/connection-gateway/v1') {
    super();
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.closed = true;
    this.readyState = FakeWebSocket.CLOSED_STATE;
    this.dispatchEvent(new Event('close'));
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN_STATE;
    this.dispatchEvent(new Event('open'));
  }

  receive(message: ConnectionGatewayWsServerMessage): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }));
  }
}

function makeWebSocketConstructor(socket: FakeWebSocket) {
  return class {
    static OPEN = FakeWebSocket.OPEN;

    constructor(readonly url: string) {
      return socket;
    }
  } as unknown as typeof WebSocket;
}

function makeOptions() {
  return {
    gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
    connectToken: 'scoped-token',
    userId: 'tmb-1',
    source: 'debug:tmbId:tmb-1',
    tokenTtlMs: 30_000,
    reconnect: false
  };
}

function makeTarget() {
  return {
    runtime: {
      invokePlugin: async () => ({
        output: {
          stream: {
            consume: async (callback: (chunk: unknown) => Promise<void> | void) => {
              await callback({
                type: 'response',
                data: {
                  ok: true
                }
              });
            }
          }
        }
      })
    } as never,
    snapshot: {
      entryDir: '/tmp/plugin',
      indexPath: '/tmp/plugin/index.ts',
      pluginId: 'getTime',
      version: '1.0.0',
      name: 'getTime',
      description: 'Get time',
      toolDescription: 'Get time',
      tags: [],
      permissions: [],
      secretSchema: {},
      isToolSet: false,
      tools: [
        {
          id: 'tool',
          name: 'getTime',
          description: 'Get time',
          toolDescription: 'Get time',
          inputSchema: {},
          outputSchema: {}
        }
      ]
    }
  };
}

function makeSession() {
  return {
    id: 'session-a',
    consumerType: 'plugin-debug',
    subject: 'tmb-1',
    sessionScope: {
      userId: 'tmb-1',
      source: 'debug:tmbId:tmb-1'
    },
    transport: 'websocket' as const,
    capabilities: ['gateway.bind', 'invoke'],
    generation: 0,
    ownerNodeId: 'node-a',
    status: 'connected' as const,
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    expiresAt: Date.now() + 30_000
  };
}

function makeSystemVar() {
  return {
    app: {
      id: 'debug-app',
      name: 'FastGPT Local Debug'
    },
    chat: {
      chatId: 'debug-chat',
      uid: 'debugger'
    },
    invokeToken: 'debug-invoke-token',
    time: new Date().toISOString()
  };
}
