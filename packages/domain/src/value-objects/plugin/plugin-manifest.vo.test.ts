import { describe, expect, it } from 'vitest';

import { ToolManifestSchema } from './plugin-manifest.vo';

describe('ToolManifestSchema', () => {
  it('keeps newly-authored plugin metadata bilingual and strict', () => {
    const manifest = {
      pluginId: 'search',
      version: '1.0.0',
      type: 'tool',
      name: { en: 'Search', 'zh-CN': '搜索' },
      icon: 'logo.svg',
      description: { en: 'Search the web', 'zh-CN': '搜索网页' },
      toolDescription: 'Search query runner',
      secretSchema: {}
    };

    expect(() => ToolManifestSchema.parse({ ...manifest, name: 'Legacy name' })).toThrow();
    expect(() => ToolManifestSchema.parse({ ...manifest, description: { en: 'Only English' } })).toThrow();
    expect(() => ToolManifestSchema.parse({ ...manifest, versionDescription: 'Legacy version text' })).toThrow();
  });
});
