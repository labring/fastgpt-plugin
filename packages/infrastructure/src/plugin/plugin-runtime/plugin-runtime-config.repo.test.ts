import { expect, it, vi } from 'vitest';

import type { MongoClient } from '../../storage/mongo';

import { PluginRuntimeConfigRepo } from './plugin-runtime-config.repo';

it.each([undefined, 'coworkerd'])('isolates persisted configuration with namespace %s without changing legacy keys', async (namespace) => {
  const model = {
    findOne: vi.fn(() => ({ lean: async () => null })),
    updateOne: vi.fn(async () => ({})),
    deleteOne: vi.fn(async () => ({}))
  };
  const mongoClient = { getModel: () => model } as unknown as MongoClient;
  const defaults = { tenantId: 'system' };
  const repo = new PluginRuntimeConfigRepo({ mongoClient }, defaults, namespace);
  const pluginId = namespace ? 'coworkerd:plugin' : 'plugin';
  expect(await repo.getPluginRuntimeConfig('plugin')).toEqual([defaults, null]);
  expect(model.findOne).toHaveBeenCalledWith({ pluginId });
  expect((await repo.savePluginRuntimeConfig('plugin', defaults))[1]).toBeNull();
  expect(model.updateOne).toHaveBeenCalledWith({ pluginId }, { $set: { config: defaults } }, { upsert: true });
  expect(await repo.resetPluginRuntimeConfig('plugin')).toEqual([defaults, null]);
  expect(model.deleteOne).toHaveBeenCalledWith({ pluginId });
});
