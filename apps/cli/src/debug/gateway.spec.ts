import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConnectionGatewayWsServerMessage } from '@domain/value-objects/connection-gateway.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { PluginChannelClientMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';

import { connectDebugGateway } from './gateway';
import { RemoteDebugInvokeBridge } from './remote-invoke';
import { createLocalDebugRuntime } from './runtime';

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

  it('sends gateway heartbeats after bind so owner lease depends on the local client', async () => {
    vi.useFakeTimers();
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

    await vi.advanceTimersByTimeAsync(5_000);

    expect(socket.sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: 'connection-gateway.ws.v1',
          type: 'heartbeat'
        })
      ])
    );

    client.close();
    await client.closed;
    vi.useRealTimers();
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

  it('routes remote debug reverse uploadFile calls through FastGPT invoke APIs', async () => {
    const socket = new FakeWebSocket();
    vi.stubGlobal('WebSocket', makeWebSocketConstructor(socket));
    const fastgptFetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          data: {
            url: 'https://fastgpt.example.com/file/echo.txt'
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    );
    vi.stubGlobal('fetch', fastgptFetch);

    const target = makeReverseUploadTarget();
    const clientPromise = connectDebugGateway({
      targets: [target],
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
        requestId: 'request-upload',
        traceId: 'trace-upload',
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
            systemVar: {
              ...makeSystemVar(),
              invokeToken: 'real-fastgpt-invoke-token'
            }
          }
        }
      }
    });

    await vi.waitFor(() => {
      expect(fastgptFetch).toHaveBeenCalledWith(
        'https://fastgpt.example.com/api/invoke/fileUpload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers)
        })
      );
    });
    const init = fastgptFetch.mock.calls[0]![1]!;
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer real-fastgpt-invoke-token');
    await vi.waitFor(() => {
      expect(socket.sent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'envelope',
            envelope: expect.objectContaining({
              type: 'stream',
              requestId: 'request-upload',
              payload: expect.objectContaining({
                kind: 'plugin-debug.stream',
                event: 'chunk',
                data: {
                  type: 'response',
                  data: {
                    value: 'https://fastgpt.example.com/file/echo.txt'
                  }
                }
              })
            })
          })
        ])
      );
    });

    client.close();
    await client.closed;
  });

  it('updates local debug targets without rebinding the WSS session', async () => {
    const socket = new FakeWebSocket();
    vi.stubGlobal('WebSocket', makeWebSocketConstructor(socket));

    const clientPromise = connectDebugGateway({
      targets: [makeTarget({ response: 'old' })],
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

    client.updateTargets([makeTarget({ response: 'new' })]);
    socket.receive(makeRunEnvelope('request-after-update'));

    await vi.waitFor(() => {
      expect(socket.sent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'envelope',
            envelope: expect.objectContaining({
              type: 'stream',
              requestId: 'request-after-update',
              payload: {
                kind: 'plugin-debug.stream',
                event: 'chunk',
                data: {
                  type: 'response',
                  data: {
                    value: 'new'
                  }
                }
              }
            })
          })
        ])
      );
    });
    expect(
      socket.sent.filter((message) => (message as { type?: string }).type === 'bind')
    ).toHaveLength(1);
    expect(socket.sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: 'connection-gateway.ws.v1',
          type: 'metadata',
          metadata: {
            pluginDebug: {
              targets: [
                expect.objectContaining({
                  pluginId: 'getTime',
                  tools: expect.any(Array)
                })
              ]
            }
          }
        })
      ])
    );

    client.close();
    await client.closed;
  });

  it('fails bind with a clear gateway error when another client already owns the debug source', async () => {
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
    const bind = socket.sent[0] as { requestId: string };
    socket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'error',
      requestId: bind.requestId,
      code: 'connection_gateway.session_already_bound',
      message: 'Gateway session already bound'
    });
    socket.close();

    await expect(clientPromise).rejects.toThrow('Gateway session already bound');
  });

  it('stops reconnecting when gateway reports the debug source is already bound', async () => {
    const firstSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=1');
    const secondSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=2');
    const webSocketCtor = makeTrackedWebSocketConstructorSequence([firstSocket, secondSocket]);
    vi.stubGlobal('WebSocket', webSocketCtor.ctor);
    const onLog = vi.fn();

    const clientPromise = connectDebugGateway({
      targets: [makeTarget()],
      options: {
        ...makeOptions(),
        reconnect: true,
        reconnectIntervalMs: 5
      },
      onLog
    });

    firstSocket.open();
    await vi.waitFor(() => {
      expect(firstSocket.sent).toHaveLength(1);
    });
    firstSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (firstSocket.sent[0] as { requestId: string }).requestId,
      session: makeSession()
    });
    const client = await clientPromise;

    expect(client.session.id).toBe('session-a');

    firstSocket.close();
    await vi.waitFor(() => {
      expect(webSocketCtor.calls()).toBe(2);
    });
    secondSocket.open();
    await vi.waitFor(() => {
      expect(secondSocket.sent).toHaveLength(1);
    });
    const bind = secondSocket.sent[0] as { requestId: string };
    secondSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'error',
      requestId: bind.requestId,
      code: 'connection_gateway.session_already_bound',
      message: 'Gateway session already bound'
    });
    secondSocket.close();

    await expect(client.closed).rejects.toThrow('Gateway session already bound');
    expect(webSocketCtor.calls()).toBe(2);
  });

  it('refreshes the connect token before reconnecting the WSS session', async () => {
    const firstSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=1');
    const secondSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=2');
    const webSocketCtor = makeTrackedWebSocketConstructorSequence([firstSocket, secondSocket]);
    vi.stubGlobal('WebSocket', webSocketCtor.ctor);
    const resolveReconnectOptions = vi.fn(async () => ({
      ...makeOptions(),
      connectToken: 'refreshed-token',
      reconnect: true,
      reconnectIntervalMs: 5
    }));

    const clientPromise = connectDebugGateway({
      targets: [makeTarget()],
      options: {
        ...makeOptions(),
        reconnect: true,
        reconnectIntervalMs: 5,
        resolveReconnectOptions
      }
    });

    firstSocket.open();
    await vi.waitFor(() => {
      expect(firstSocket.sent).toHaveLength(1);
    });
    expect(firstSocket.sent[0]).toMatchObject({
      type: 'bind',
      token: 'scoped-token'
    });
    firstSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (firstSocket.sent[0] as { requestId: string }).requestId,
      session: makeSession()
    });
    const client = await clientPromise;

    firstSocket.close();
    await vi.waitFor(() => {
      expect(resolveReconnectOptions).toHaveBeenCalledTimes(1);
      expect(webSocketCtor.calls()).toBe(2);
    });
    secondSocket.open();
    await vi.waitFor(() => {
      expect(secondSocket.sent).toHaveLength(1);
    });
    expect(secondSocket.sent[0]).toMatchObject({
      type: 'bind',
      token: 'refreshed-token'
    });
    secondSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (secondSocket.sent[0] as { requestId: string }).requestId,
      session: makeSession({
        id: 'session-b'
      })
    });

    client.close();
    secondSocket.close();
    await client.closed;
  });

  it('notifies the caller after a reconnect binds a new WSS session', async () => {
    const firstSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=1');
    const secondSocket = new FakeWebSocket('wss://gateway.example.com/connection-gateway/v1?attempt=2');
    const webSocketCtor = makeTrackedWebSocketConstructorSequence([firstSocket, secondSocket]);
    vi.stubGlobal('WebSocket', webSocketCtor.ctor);
    const onReconnect = vi.fn();

    const clientPromise = connectDebugGateway({
      targets: [makeTarget()],
      options: {
        ...makeOptions(),
        reconnect: true,
        reconnectIntervalMs: 5,
        resolveReconnectOptions: async () => ({
          ...makeOptions(),
          connectToken: 'refreshed-token',
          reconnect: true,
          reconnectIntervalMs: 5
        })
      },
      onReconnect
    });

    firstSocket.open();
    await vi.waitFor(() => {
      expect(firstSocket.sent).toHaveLength(1);
    });
    firstSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (firstSocket.sent[0] as { requestId: string }).requestId,
      session: makeSession()
    });
    const client = await clientPromise;

    expect(onReconnect).not.toHaveBeenCalled();

    firstSocket.close();
    await vi.waitFor(() => {
      expect(webSocketCtor.calls()).toBe(2);
    });
    secondSocket.open();
    await vi.waitFor(() => {
      expect(secondSocket.sent).toHaveLength(1);
    });
    secondSocket.receive({
      protocol: 'connection-gateway.ws.v1',
      type: 'bound',
      requestId: (secondSocket.sent[0] as { requestId: string }).requestId,
      session: makeSession({
        id: 'session-b'
      })
    });

    await vi.waitFor(() => {
      expect(onReconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-b'
        })
      );
    });

    client.close();
    secondSocket.close();
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

function makeTrackedWebSocketConstructorSequence(sockets: FakeWebSocket[]) {
  let callCount = 0;
  const ctor = class {
    static OPEN = FakeWebSocket.OPEN;

    constructor(readonly url: string) {
      callCount += 1;
      const socket = sockets.shift();
      if (!socket) {
        throw new Error(`Unexpected WebSocket creation: ${url}`);
      }
      return socket;
    }
  } as unknown as typeof WebSocket;

  return {
    ctor,
    calls: () => callCount
  };
}

function makeOptions() {
  return {
    gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
    connectToken: 'scoped-token',
    userId: 'tmb-1',
    source: 'debug:tmbId:tmb-1',
    fastgptBaseUrl: 'https://fastgpt.example.com',
    tokenTtlMs: 30_000,
    reconnect: false
  };
}

function makeTarget({ response = true }: { response?: unknown } = {}) {
  return {
    runtime: {
      invokePlugin: async () => ({
        output: {
          stream: {
            consume: async (callback: (chunk: unknown) => Promise<void> | void) => {
              await callback({
                type: 'response',
                data: {
                  value: response
                }
              });
            }
          }
        }
      })
    } as never,
    snapshot: makeSnapshot()
  };
}

function makeReverseUploadTarget() {
  const runtime = createLocalDebugRuntime();
  const invokeBridge = new RemoteDebugInvokeBridge('https://fastgpt.example.com');
  invokeBridge.attach(runtime);

  return {
    runtime: {
      invokePlugin: async (
        _method: string,
        _params: unknown,
        options?: { traceId?: string }
      ) => ({
        output: {
          stream: {
            consume: async (callback: (chunk: unknown) => Promise<void> | void) => {
              const uploadInput = StreamData.create<Buffer>();
              uploadInput.write(Buffer.from('hello remote upload'));
              uploadInput.end();
              const response = await runtime.pluginChannel.request(
                PluginChannelClientMethod.request,
                {
                  method: 'uploadFile',
                  args: {
                    fileName: 'echo.txt',
                    contentType: 'text/plain'
                  }
                },
                {
                  traceId: options?.traceId,
                  input: uploadInput
                }
              );
              const [result, err] = response.result as [{ accessURL: string } | undefined, unknown];
              if (err) {
                throw err instanceof Error ? err : new Error(String(err));
              }
              await callback({
                type: 'response',
                data: {
                  value: result?.accessURL
                }
              });
            }
          }
        }
      })
    } as never,
    invokeBridge,
    snapshot: makeSnapshot()
  };
}

function makeSnapshot() {
  return {
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
  };
}

function makeRunEnvelope(requestId: string): ConnectionGatewayWsServerMessage {
  return {
    protocol: 'connection-gateway.ws.v1',
    type: 'envelope',
    envelope: {
      protocol: 'connection-gateway.v1',
      sessionId: 'session-a',
      generation: 0,
      requestId,
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
  };
}

function makeSession(overrides: Partial<ReturnType<typeof makeSessionBase>> = {}) {
  return {
    ...makeSessionBase(),
    ...overrides
  };
}

function makeSessionBase() {
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
