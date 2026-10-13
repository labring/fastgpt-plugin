import { describe, expect, it, vi } from 'vitest';

import type { ToolType } from '@domain/entities/tool.entity';
import { successResult } from '@domain/value-objects/result.vo';

import { toolPluginCodec } from './tool.codec';

describe('toolPluginCodec', () => {
  it('refreshes only present localized README URLs while retaining the legacy URL', async () => {
    const tool = {
      pluginId: 'readme-tool',
      version: '1.0.0',
      etag: 'etag-1',
      type: 'tool',
      name: { en: 'README tool', 'zh-CN': 'README 工具' },
      description: { en: 'README tool', 'zh-CN': 'README 工具' },
      icon: 'logo.svg',
      readmeUrl: 'README.md',
      readmeUrls: {
        en: 'README.en.md',
        'zh-CN': 'README.zh-CN.md'
      },
      toolDescription: 'README tool',
      inputSchema: {},
      outputSchema: {},
      secretSchema: {}
    } as ToolType;
    const resolvePublicFileURL = vi.fn(async (value: string | undefined) =>
      successResult(value ? `https://cdn.example.com/${value}` : undefined)
    );

    const [refreshed, error] = await toolPluginCodec.refreshConfirmedAssets(tool, {
      resolvePublicFileURL
    });

    expect(error).toBeNull();
    expect(refreshed?.readmeUrl).toBe('https://cdn.example.com/README.md');
    expect(refreshed?.readmeUrls).toEqual({
      en: 'https://cdn.example.com/README.en.md',
      'zh-CN': 'https://cdn.example.com/README.zh-CN.md'
    });
    expect(resolvePublicFileURL).toHaveBeenCalledWith('logo.svg');
    expect(resolvePublicFileURL).toHaveBeenCalledWith('README.md');
    expect(resolvePublicFileURL).toHaveBeenCalledWith('README.en.md');
    expect(resolvePublicFileURL).toHaveBeenCalledWith('README.zh-CN.md');
    expect(resolvePublicFileURL).not.toHaveBeenCalledWith('README.zh-Hant.md');
  });
});
