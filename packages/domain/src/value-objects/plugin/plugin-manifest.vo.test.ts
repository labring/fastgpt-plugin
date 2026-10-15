import { describe, expect, it } from 'vitest';

import { ToolManifestSchema } from './plugin-manifest.vo';

describe('ToolManifestSchema', () => {
  it('ignores legacy tool descriptions and preserves the canonical description', () => {
    const description = { en: 'Search the web', 'zh-CN': '搜索网页' };
    const manifest = ToolManifestSchema.parse({
      pluginId: 'search',
      version: '1.0.0',
      type: 'tool',
      name: { en: 'Search', 'zh-CN': '搜索' },
      icon: 'logo.svg',
      description,
      toolDescription: 'Legacy model-facing description',
      secretSchema: {},
      children: [
        {
          id: 'query',
          name: { en: 'Query', 'zh-CN': '查询' },
          description,
          toolDescription: 'Legacy child description',
          icon: 'query.svg',
          inputSchema: {},
          outputSchema: {}
        }
      ]
    });

    expect(manifest.description).toEqual(description);
    expect(manifest).not.toHaveProperty('toolDescription');
    expect(manifest.children?.[0]).not.toHaveProperty('toolDescription');
  });

  it('keeps newly-authored plugin metadata bilingual and strict', () => {
    const manifest = {
      pluginId: 'search',
      version: '1.0.0',
      type: 'tool',
      name: { en: 'Search', 'zh-CN': '搜索' },
      icon: 'logo.svg',
      description: { en: 'Search the web', 'zh-CN': '搜索网页' },
      secretSchema: {}
    };

    expect(() => ToolManifestSchema.parse({ ...manifest, name: 'Legacy name' })).toThrow();
    expect(() => ToolManifestSchema.parse({ ...manifest, description: { en: 'Only English' } })).toThrow();
    expect(() => ToolManifestSchema.parse({ ...manifest, versionDescription: 'Legacy version text' })).toThrow();
  });
});
