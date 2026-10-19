import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginTypeEnum } from '../../entities/plugin-base.entity';

import { ToolDetailSchema } from './tool.port';

describe('ToolDetailSchema legacy toolDescription compatibility', () => {
  it('retains legacy metadata on tools, child tools, and schema properties', () => {
    const legacyDescription = { en: 'Search text', 'zh-CN': '搜索文本' };
    const detail = ToolDetailSchema.parse({
      pluginId: 'search',
      version: '1.0.0',
      etag: 'etag',
      type: PluginTypeEnum.tool,
      name: { en: 'Search', 'zh-CN': '搜索' },
      icon: 'https://example.com/icon.svg',
      description: { en: 'Search plugin', 'zh-CN': '搜索插件' },
      toolDescription: legacyDescription,
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', toolDescription: legacyDescription } }
      },
      outputSchema: { type: 'object' },
      children: [
        {
          id: 'search-child',
          name: { en: 'Search', 'zh-CN': '搜索' },
          icon: 'https://example.com/child.svg',
          toolDescription: legacyDescription,
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' }
        }
      ],
      source: 'system',
      isLatestVersion: true,
      isToolset: true
    });

    expect(detail.toolDescription).toEqual(legacyDescription);
    expect(detail.children?.[0].toolDescription).toEqual(legacyDescription);
    const inputSchema = z
      .object({ properties: z.object({ query: z.object({ toolDescription: z.unknown() }) }) })
      .parse(detail.inputSchema);
    expect(inputSchema.properties.query.toolDescription).toEqual(legacyDescription);
  });
});
