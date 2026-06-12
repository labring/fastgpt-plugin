import { EventEmitter } from 'node:events';
import net from 'node:net';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { connectDebugGateway } from './gateway';

describe('connectDebugGateway', () => {
  const fetchMock = vi.fn<typeof fetch>();

  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('cleans up the gateway session when the client closes', async () => {
    const receivedFrames: unknown[] = [];
    const connectSpy = vi.spyOn(net, 'connect');
    connectSpy.mockImplementation(
      ((_port: number, _host: string, connectListener?: () => void) => {
        const socket = new FakeSocket((chunk) => {
          receivedFrames.push(...decodeFrames(chunk));
        });
        queueMicrotask(() => {
          connectListener?.();
        });
        return socket as unknown as net.Socket;
      }) as typeof net.connect
    );

    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { session: makeSession() } }))
      .mockResolvedValueOnce(jsonResponse({ data: { deleted: true } }));

    const client = await connectDebugGateway({
      targets: [makeTarget()],
      options: makeOptions()
    });

    client.close();
    await client.closed;

    expect(receivedFrames).toEqual([
      expect.objectContaining({
        type: 'event',
        capability: 'gateway.bind',
        sessionId: 'session-a'
      })
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://gateway.local/internal/sessions/session-a',
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer gateway-token'
        }
      })
    );
  });

  it('cleans up the gateway session when tcp connect fails', async () => {
    const connectError = new Error('tcp unavailable');
    const connectSpy = vi.spyOn(net, 'connect');
    connectSpy.mockImplementation(
      ((_port: number, _host: string, _connectListener?: () => void) => {
        const socket = new FakeSocket(() => undefined);
        queueMicrotask(() => {
          socket.emit('error', connectError);
        });
        return socket as unknown as net.Socket;
      }) as typeof net.connect
    );

    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { session: makeSession() } }))
      .mockResolvedValueOnce(jsonResponse({ data: { deleted: true } }));

    await expect(
      connectDebugGateway({
        targets: [makeTarget()],
        options: makeOptions()
      })
    ).rejects.toThrow('tcp unavailable');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://gateway.local/internal/sessions/session-a',
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});

class FakeSocket extends EventEmitter {
  constructor(private readonly onWrite: (chunk: Buffer) => void) {
    super();
  }

  write(chunk: Buffer, callback?: (error?: Error) => void): boolean {
    this.onWrite(chunk);
    callback?.();
    return true;
  }

  end(): this {
    this.emit('close');
    return this;
  }
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function makeOptions() {
  return {
    baseUrl: 'http://gateway.local',
    authToken: 'gateway-token',
    jwtSecret: 'jwt-secret',
    tcpHost: '127.0.0.1',
    tcpPort: 3011,
    userId: 'u1',
    tokenTtlMs: 30_000,
    reconnect: false
  };
}

function makeTarget() {
  return {
    runtime: {} as never,
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
      tools: []
    }
  };
}

function makeSession() {
  return {
    id: 'session-a',
    consumerType: 'plugin-debug',
    subject: 'user:u1',
    sessionScope: {
      userId: 'u1',
      source: 'debug:user:u1'
    },
    transport: 'tcp',
    capabilities: ['invoke'],
    generation: 0,
    ownerNodeId: 'node-a',
    status: 'connecting',
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    expiresAt: Date.now() + 30_000
  };
}

function decodeFrames(chunk: Buffer): unknown[] {
  const frames: unknown[] = [];
  let buffer = chunk;

  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd < 0) {
      return frames;
    }

    const header = buffer.subarray(0, headerEnd).toString('utf8');
    const contentLength = Number(
      header
        .split(/\r?\n/)
        .find((line) => line.toLowerCase().startsWith('content-length:'))
        ?.split(':')[1]
        ?.trim()
    );
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    frames.push(JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString('utf8')));
    buffer = buffer.subarray(bodyEnd);
  }

  return frames;
}
