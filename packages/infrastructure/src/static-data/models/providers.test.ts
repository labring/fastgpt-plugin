import { readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { aiproxyChannels } from './providers';

const MODEL_LOGO_EXTENSIONS = new Set(['svg', 'png', 'jpeg', 'webp', 'jpg']);
const channelAvatarDir = path.resolve(__dirname, 'channel-avatar');

describe('static AIProxy channel presets', () => {
  it('defines unique channelIds with matching avatar assets', () => {
    const channelIds = aiproxyChannels.map(({ channelId }) => channelId);
    expect(new Set(channelIds).size).toBe(channelIds.length);

    const avatarSlugs = new Set(
      readdirSync(channelAvatarDir)
        .filter((file) => MODEL_LOGO_EXTENSIONS.has(path.extname(file).slice(1).toLowerCase()))
        .map((file) => path.basename(file, path.extname(file)))
    );

    const missingAvatars = aiproxyChannels
      .map(({ avatar }) => avatar)
      .filter((avatar) => !avatarSlugs.has(avatar));

    expect(missingAvatars).toEqual([]);
  });

  it('includes Baidu Qianfan channel 49 before legacy Ernie V2 channel 13', () => {
    const qianfanIndex = aiproxyChannels.findIndex(({ channelId }) => channelId === 49);
    const ernieV2Index = aiproxyChannels.findIndex(({ channelId }) => channelId === 13);

    expect(qianfanIndex).toBeGreaterThanOrEqual(0);
    expect(ernieV2Index).toBeGreaterThan(qianfanIndex);
    expect(aiproxyChannels[qianfanIndex]).toEqual({
      channelId: 49,
      name: {
        en: 'Baidu Qianfan',
        'zh-CN': '百度千帆',
        'zh-Hant': '百度千帆'
      },
      avatar: 'qianfan',
      website: 'https://qianfan.cloud.baidu.com'
    });
  });
});
