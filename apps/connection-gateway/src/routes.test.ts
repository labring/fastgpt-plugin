import { describe, expect, it, vi } from 'vitest';

import { createConnectionGatewayApp } from './routes';

describe('connection gateway routes', () => {
  it('delete session should disconnect live connection before returning success', async () => {
    const deleteSession = vi.fn(async () => undefined);
    const disconnectSession = vi.fn(() => true);
    const app = createConnectionGatewayApp({
      service: {
        deleteSession
      } as never,
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
      service: {
        deleteSession
      } as never,
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
});
