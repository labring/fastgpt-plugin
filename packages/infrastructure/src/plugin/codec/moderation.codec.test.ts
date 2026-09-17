import { describe, expect, it } from 'vitest';

import type { ModerationType } from '@domain/entities/moderation.entity';
import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { moderationPluginCodec } from './moderation.codec';

const plugin = (): ModerationType =>
  ({
    pluginId: 'moderation-a',
    version: '1.0.0',
    etag: 'etag-a',
    type: PluginTypeEnum.moderation,
    name: { en: 'Moderation A', 'zh-CN': '审查 A' },
    icon: 'logo.svg',
    readmeUrl: 'readme.md',
    description: { en: 'Moderation A', 'zh-CN': '审查 A' },
    meta: { provider: 'keyword', modalities: ['text'] },
    secretSchema: {}
  }) as ModerationType;

describe('moderationPluginCodec.refreshConfirmedAssets', () => {
  it('replaces icon and readme with the freshly resolved public URLs', async () => {
    const [result, err] = await moderationPluginCodec.refreshConfirmedAssets(plugin(), {
      resolvePublicFileURL: async (value) => successResult(`https://cdn.example.com/${value}`)
    });

    expect(err).toBeNull();
    expect(result).toMatchObject({
      icon: 'https://cdn.example.com/logo.svg',
      readmeUrl: 'https://cdn.example.com/readme.md'
    });
  });

  it('forwards the resolver failure', async () => {
    const [result, err] = await moderationPluginCodec.refreshConfirmedAssets(plugin(), {
      resolvePublicFileURL: async () => failureResult(new Error('storage offline'))
    });

    expect(result).toBeNull();
    expect(err?.error.message).toBe('storage offline');
  });
});
