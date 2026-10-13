import { describe, expect, it, vi } from 'vitest';

import type { ToolType } from '@domain/entities/tool.entity';
import { successResult } from '@domain/value-objects/result.vo';

import { PluginRecordSchema } from './plugin.record';
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

  it('normalizes legacy plugin and child metadata on read and writes normalized metadata', () => {
    const record = PluginRecordSchema.parse({
      pluginId: 'legacy-search',
      version: '1.0.0',
      etag: 'legacy-etag',
      type: 'tool',
      name: 'Legacy Search Tool',
      description: 'Legacy tool description',
      versionDescription: 'Initial version',
      icon: 'logo.svg',
      data: {
        toolDescription: 'Search query runner',
        children: [
          {
            id: 'run',
            name: 'Run Query',
            description: 'Execute search query',
            toolDescription: 'Execute query',
            icon: 'logo.svg',
            inputSchema: {},
            outputSchema: {}
          }
        ]
      }
    });
    const plugin = toolPluginCodec.fromRecord(record);

    expect(plugin.name).toEqual({ en: 'Legacy Search Tool', 'zh-CN': 'Legacy Search Tool' });
    expect(plugin.description).toEqual({
      en: 'Legacy tool description',
      'zh-CN': 'Legacy tool description'
    });
    expect(plugin.versionDescription).toEqual({ en: 'Initial version', 'zh-CN': 'Initial version' });
    expect(plugin.children?.[0]).toMatchObject({
      name: { en: 'Run Query', 'zh-CN': 'Run Query' },
      description: { en: 'Execute search query', 'zh-CN': 'Execute search query' }
    });

    const persistedRecord = toolPluginCodec.toRecord(plugin);
    expect(persistedRecord.name).toEqual({ en: 'Legacy Search Tool', 'zh-CN': 'Legacy Search Tool' });
    expect(persistedRecord.description).toEqual({
      en: 'Legacy tool description',
      'zh-CN': 'Legacy tool description'
    });
    expect(persistedRecord.data).toMatchObject({
      children: [
        {
          name: { en: 'Run Query', 'zh-CN': 'Run Query' },
          description: { en: 'Execute search query', 'zh-CN': 'Execute search query' }
        }
      ]
    });
  });
});
