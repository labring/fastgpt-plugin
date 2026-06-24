import { describe, expect, it, vi } from 'vitest';

import { FastGPTPluginClient } from './client';

describe('FastGPTPluginClient debug sessions', () => {
  it('enables a debug channel', async () => {
    const { client, fetchMock } = createClient({
      tmbId: 'tmb-1',
      source: 'debug:tmbId:tmb-1',
      status: 'enabled',
      enabled: true,
      keyId: 'key-1',
      connectionKey: 'connection-key',
      createdAt: 1000,
      updatedAt: 1000
    });

    const result = await client.createDebugSession({ tmbId: 'tmb-1' });

    expect(result.connectionKey).toBe('connection-key');
    expect(getRequest(fetchMock)).toMatchObject({
      url: 'https://plugin.local/api/plugin/debug-sessions',
      method: 'POST',
      authorization: 'Bearer token',
      body: { tmbId: 'tmb-1' }
    });
  });

  it('refreshes a debug channel connection key', async () => {
    const { client, fetchMock } = createClient({
      tmbId: 'tmb-1',
      source: 'debug:tmbId:tmb-1',
      status: 'enabled',
      enabled: true,
      keyId: 'key-2',
      connectionKey: 'new-connection-key',
      createdAt: 1000,
      updatedAt: 2000
    });

    const result = await client.refreshDebugSessionKey({ tmbId: 'tmb-1' });

    expect(result.keyId).toBe('key-2');
    expect(getRequest(fetchMock)).toMatchObject({
      url: 'https://plugin.local/api/plugin/debug-sessions/key:refresh',
      method: 'POST',
      body: { tmbId: 'tmb-1' }
    });
  });

  it('exchanges a debug channel connection key', async () => {
    const { client, fetchMock } = createClient({
      gatewayUrl: 'wss://gateway.local/connection-gateway/v1',
      transport: 'websocket',
      source: 'debug:tmbId:tmb-1',
      connectToken: 'connect-token',
      expiresAt: 2000
    });

    const result = await client.exchangeDebugSessionConnectionKey({
      connectionKey: 'connection-key'
    });

    expect(result.connectToken).toBe('connect-token');
    expect(getRequest(fetchMock)).toMatchObject({
      url: 'https://plugin.local/api/plugin/debug-sessions/connection-key:exchange',
      method: 'POST',
      body: { connectionKey: 'connection-key' }
    });
  });

  it('gets debug channel status', async () => {
    const { client, fetchMock } = createClient({
      tmbId: 'tmb-1',
      source: 'debug:tmbId:tmb-1',
      status: 'connected',
      enabled: true,
      keyId: 'key-1',
      plugins: [],
      gateway: {
        sessionId: 'gateway-session-1',
        ownerAlive: true,
        mailboxLag: 0
      }
    });

    const result = await client.getDebugSessionStatus({
      tmbId: 'tmb-1'
    });

    expect(result.status).toBe('connected');
    expect(getRequest(fetchMock)).toMatchObject({
      url: 'https://plugin.local/api/plugin/debug-sessions/tmb-1',
      method: 'GET'
    });
  });

  it('revokes a debug channel', async () => {
    const { client, fetchMock } = createClient({
      revoked: true
    });

    const result = await client.revokeDebugSession({
      tmbId: 'tmb-1',
      reason: 'done'
    });

    expect(result.revoked).toBe(true);
    expect(getRequest(fetchMock)).toMatchObject({
      url: 'https://plugin.local/api/plugin/debug-sessions/tmb-1/revoke',
      method: 'POST',
      body: { tmbId: 'tmb-1', reason: 'done' }
    });
  });
});

function createClient(data: unknown): {
  client: FastGPTPluginClient;
  fetchMock: ReturnType<typeof vi.fn>;
} {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  return {
    client: new FastGPTPluginClient({
      baseUrl: 'https://plugin.local',
      token: 'token',
      fetch: fetchMock as typeof fetch
    }),
    fetchMock
  };
}

function getRequest(fetchMock: ReturnType<typeof vi.fn>): {
  url: string;
  method: string;
  authorization: string | null;
  body: unknown;
} {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  const headers = new Headers(init.headers);

  return {
    url,
    method: init.method ?? 'GET',
    authorization: headers.get('Authorization'),
    body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined
  };
}
