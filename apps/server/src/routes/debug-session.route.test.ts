import { afterEach, describe, expect, it, vi } from 'vitest';

import { successResult } from '@domain/value-objects/result.vo';

import { makeDebugSessionRoute } from './debug-session.route';

describe('debug session route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not expose debug plugins when gateway status is not owner alive', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: {
          session: {
            id: 'gateway-session-a',
            status: 'connected'
          },
          ownerAlive: false,
          mailboxLag: 0
        }
      })
    );
    const pluginList = vi.fn(async () =>
      successResult([
        {
          pluginId: 'dailyHot',
          version: '0.1.1',
          etag: 'debug-etag',
          type: 'tool',
          name: { en: 'Daily Hot', 'zh-CN': 'Daily Hot' },
          icon: '',
          description: { en: 'Daily hot', 'zh-CN': 'Daily hot' },
          tags: ['tools'],
          source: 'debug:tmbId:tmb-1'
        }
      ])
    );
    const app = makeDebugSessionRoute({
      pluginDebugSessionRepo: {
        get: vi.fn(async () => ({
          tmbId: 'tmb-1',
          source: 'debug:tmbId:tmb-1',
          status: 'enabled',
          enabled: true,
          keyId: 'key-id',
          connectionKeyHash: 'connection-key-hash',
          createdAt: 1,
          updatedAt: 1
        }))
      } as never,
      pluginRepo: {
        list: pluginList
      } as never
    });

    const response = await app.request('/plugin/debug-sessions/tmb-1');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(pluginList).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      data: {
        status: 'enabled',
        plugins: [],
        gateway: {
          sessionId: 'gateway-session-a',
          ownerAlive: false
        }
      }
    });
  });

  it('closes existing gateway session before exchanging a connection key', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            session: {
              id: 'gateway-session-a',
              status: 'connected'
            },
            ownerAlive: true,
            mailboxLag: 0
          }
        })
      )
      .mockResolvedValueOnce(jsonResponse({ data: { deleted: true } }));
    const app = makeDebugSessionRoute({
      pluginDebugSessionRepo: {
        exchangeConnectionKey: vi.fn(async () => ({
          session: {
            tmbId: 'tmb-1',
            source: 'debug:tmbId:tmb-1',
            status: 'enabled',
            enabled: true,
            keyId: 'key-id',
            connectionKeyHash: 'connection-key-hash',
            createdAt: 1,
            updatedAt: 1
          }
        }))
      } as never,
      pluginRepo: {
        list: vi.fn(async () => successResult([]))
      } as never
    });

    const response = await app.request('/plugin/debug-sessions/connection-key:exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        connectionKey: 'connection-key'
      })
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3010/internal/sessions/by-source/debug%3AtmbId%3Atmb-1/status',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer token'
        }
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3010/internal/sessions/gateway-session-a',
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer token'
        }
      })
    );
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
