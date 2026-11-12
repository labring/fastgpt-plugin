import { describe, expect, it, vi } from 'vitest';

import { successResult } from '@domain/value-objects/result.vo';

import { makePluginRoute, type PluginRouteDeps } from './plugin.route';

const identity = { pluginId: 'keyword', version: '1.0.0', etag: 'abc' };

function setup() {
  const repo = {
    listActive: vi.fn().mockResolvedValue(successResult([])),
    disableUnreferencedPlugins: vi.fn().mockResolvedValue(successResult({ plugins: [] })),
    getPluginById: vi.fn().mockResolvedValue(successResult({ info: { ...identity, type: 'moderation' } })),
    confirmPlugin: vi.fn().mockResolvedValue(successResult({ ...identity, type: 'moderation', runtimeRegistrationRequired: true })),
    list: vi.fn().mockResolvedValue(successResult([]))
  };
  const runtime = { register: vi.fn().mockResolvedValue(successResult({})), unregister: vi.fn() };
  const app = makePluginRoute({ pluginRepo: repo, pluginRuntimeManager: runtime } as unknown as PluginRouteDeps);
  return { app, repo, runtime };
}

describe('plugin lifecycle routes', () => {
  it('restores retained files and registers runtime without an upload', async () => {
    const { app, repo, runtime } = setup();
    const response = await app.request('/plugin/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...identity, source: 'system' }) });
    expect(response.status).toBe(200);
    expect(repo.confirmPlugin).toHaveBeenCalledWith(identity, 'system', true);
    expect(runtime.register).toHaveBeenCalledWith(identity);
  });
  it('passes disabled-list filtering explicitly rather than changing the default list', async () => {
    const { app, repo } = setup();
    const response = await app.request('/plugins?includeDisabled=true&types=moderation');
    expect(response.status).toBe(200);
    expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ includeDisabled: true, types: ['moderation'] }));
  });
});
