import { describe, expect, it, vi } from 'vitest';

import { successResult } from '@domain/value-objects/result.vo';

import { makePluginRoute, type PluginRouteDeps } from './plugin.route';

const moderationItem = {
  pluginId: 'moderation-a',
  version: '1.0.0',
  etag: 'etag-a',
  type: 'moderation',
  name: { en: 'Moderation A', 'zh-CN': '审查 A' },
  icon: '',
  description: { en: 'Moderation A', 'zh-CN': '审查 A' },
  source: 'system'
};

function createRoute(list: ReturnType<typeof vi.fn>) {
  return makePluginRoute({
    pluginRepo: { list } as unknown as PluginRouteDeps['pluginRepo'],
    localFileStorageRepo: {} as PluginRouteDeps['localFileStorageRepo'],
    urlFileFetcher: {} as PluginRouteDeps['urlFileFetcher'],
    pluginPKGFileResolver: {} as PluginRouteDeps['pluginPKGFileResolver'],
    pluginRuntimeManager: {} as PluginRouteDeps['pluginRuntimeManager']
  });
}

describe('plugin route list', () => {
  it('accepts the moderation plugin type filter', async () => {
    const list = vi.fn().mockResolvedValue(successResult([moderationItem]));
    const app = createRoute(list);

    const response = await app.request('/plugins?types=moderation');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [moderationItem] });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ types: ['moderation'] }));
  });
});
