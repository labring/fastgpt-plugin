import { describe, expect, it, vi } from 'vitest';

import { createConnectionGatewayApp } from './routes';

describe('connection gateway routes', () => {
  it('delete session should disconnect live connection before returning success', async () => {
    const deleteSession = vi.fn(async () => undefined);
    const disconnectSession = vi.fn(() => true);
    const app = createConnectionGatewayApp({
      nodeId: 'node-a',
      service: {
        deleteSession
      } as never,
      isSessionConnected: vi.fn(() => false),
      disconnectSession
    });

    const response = await app.request('/internal/sessions/session-live', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token'
      }
    });

    expect(response.status).toBe(200);
    expect(disconnectSession).toHaveBeenCalledWith(
      'session-live',
      expect.objectContaining({
        message: 'Gateway session revoked'
      })
    );
    expect(deleteSession).toHaveBeenCalledWith('session-live');
  });

  it('delete session should fall back to deleting registry state when no live connection exists', async () => {
    const deleteSession = vi.fn(async () => undefined);
    const disconnectSession = vi.fn(() => false);
    const app = createConnectionGatewayApp({
      nodeId: 'node-a',
      service: {
        deleteSession
      } as never,
      isSessionConnected: vi.fn(() => false),
      disconnectSession
    });

    const response = await app.request('/internal/sessions/session-offline', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token'
      }
    });

    expect(response.status).toBe(200);
    expect(disconnectSession).toHaveBeenCalledWith(
      'session-offline',
      expect.objectContaining({
        message: 'Gateway session revoked'
      })
    );
    expect(deleteSession).toHaveBeenCalledWith('session-offline');
  });

  it('marks local-owner status offline when the websocket binding is gone', async () => {
    const app = createConnectionGatewayApp({
      nodeId: 'node-a',
      service: {
        getLatestStatusBySource: vi.fn(async () => ({
          session: {
            id: 'session-stale',
            consumerType: 'plugin-debug',
            subject: 'tmb-1',
            sessionScope: {
              userId: 'tmb-1',
              source: 'debug:tmbId:tmb-1'
            },
            transport: 'websocket',
            capabilities: ['gateway.bind', 'invoke'],
            generation: 0,
            ownerNodeId: 'node-a',
            status: 'connected',
            connectedAt: Date.now(),
            lastSeenAt: Date.now(),
            expiresAt: Date.now() + 15_000,
            metadata: {
              pluginDebug: {
                targets: [
                  {
                    pluginId: 'dailyHot'
                  }
                ]
              }
            }
          },
          ownerAlive: true,
          mailboxLag: 0,
          logs: []
        }))
      } as never,
      isSessionConnected: vi.fn(() => false),
      disconnectSession: vi.fn(() => false)
    });

    const response = await app.request(
      '/internal/sessions/by-source/debug%3AtmbId%3Atmb-1/status',
      {
        headers: {
          Authorization: 'Bearer token'
        }
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      data: {
        session: {
          id: 'session-stale',
          status: 'connected'
        },
        ownerAlive: false
      }
    });
  });

  it('keeps remote-owner status lease based so multi-node routing stays valid', async () => {
    const app = createConnectionGatewayApp({
      nodeId: 'node-b',
      service: {
        getStatus: vi.fn(async () => ({
          session: {
            id: 'session-remote',
            consumerType: 'plugin-debug',
            subject: 'tmb-1',
            sessionScope: {
              userId: 'tmb-1',
              source: 'debug:tmbId:tmb-1'
            },
            transport: 'websocket',
            capabilities: ['gateway.bind', 'invoke'],
            generation: 0,
            ownerNodeId: 'node-a',
            status: 'connected',
            connectedAt: Date.now(),
            lastSeenAt: Date.now(),
            expiresAt: Date.now() + 15_000
          },
          ownerAlive: true,
          mailboxLag: 0,
          logs: []
        }))
      } as never,
      isSessionConnected: vi.fn(() => false),
      disconnectSession: vi.fn(() => false)
    });

    const response = await app.request('/internal/sessions/session-remote/status', {
      headers: {
        Authorization: 'Bearer token'
      }
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      data: {
        session: {
          id: 'session-remote'
        },
        ownerAlive: true
      }
    });
  });
});
