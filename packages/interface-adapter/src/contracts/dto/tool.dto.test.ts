import { describe, expect, it } from 'vitest';

import {
  ToolDetailDTOSchema,
  ToolGetParamsDTOSchema,
  ToolListDTOSchema
} from './tool.dto';

describe('Tool metadata DTOs', () => {
  it('preserves localized descriptions, x-i18n metadata, and legacy tool descriptions', () => {
    const description = {
      en: 'Search docs',
      'zh-CN': '搜索文档'
    };
    const legacyToolDescription = {
      en: 'Search public documentation',
      'zh-CN': '搜索公开文档'
    };
    const fieldTitle = {
      en: 'Search query',
      'zh-CN': '搜索内容'
    };
    const inputSchema = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          title: 'Search query',
          description: 'Search terms',
          toolDescription: legacyToolDescription,
          'x-i18n': {
            title: fieldTitle,
            description: legacyToolDescription,
            placeholder: fieldTitle
          }
        }
      }
    };
    const outputSchema = {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          title: 'Results',
          'x-i18n': {
            title: fieldTitle,
            description: legacyToolDescription
          }
        }
      }
    };
    const secretSchema = {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          title: 'API key',
          'x-i18n': {
            title: fieldTitle,
            placeholder: fieldTitle
          }
        }
      }
    };
    const child = {
      id: 'search',
      name: { en: 'Search', 'zh-CN': '搜索' },
      description: { en: 'Search tool', 'zh-CN': '搜索工具' },
      icon: 'https://example.com/search.svg',
      toolDescription: legacyToolDescription,
      inputSchema,
      outputSchema
    };
    const tool = {
      pluginId: 'search-docs',
      version: '1.0.0',
      etag: 'etag-1',
      type: 'tool',
      name: { en: 'Search Docs', 'zh-CN': '搜索文档' },
      icon: 'https://example.com/icon.svg',
      description,
      toolDescription: legacyToolDescription,
      inputSchema,
      outputSchema,
      secretSchema,
      children: [child]
    };

    const [summary] = ToolListDTOSchema.parse([
      {
        ...tool,
        source: 'system',
        isToolset: true,
        hasSecret: true
      }
    ]);
    const detail = ToolDetailDTOSchema.parse({
      ...tool,
      source: 'system',
      isLatestVersion: true,
      isToolset: true
    });

    expect(summary.description).toEqual(description);
    expect(summary.toolDescription).toEqual(legacyToolDescription);
    expect(summary.children?.[0].toolDescription).toEqual(legacyToolDescription);
    expect(detail.description).toEqual(description);
    expect(detail.toolDescription).toEqual(legacyToolDescription);
    expect(detail.children?.[0].toolDescription).toEqual(legacyToolDescription);
    expect(detail).toMatchObject({ inputSchema, outputSchema, secretSchema });
  });
});

describe('ToolGetParamsDTOSchema', () => {
  it('parses fallbackLatestVersion from URL query strings', () => {
    expect(
      ToolGetParamsDTOSchema.parse({
        pluginId: 'getTime',
        fallbackLatestVersion: 'true'
      }).fallbackLatestVersion
    ).toBe(true);

    expect(
      ToolGetParamsDTOSchema.parse({
        pluginId: 'getTime',
        fallbackLatestVersion: 'false'
      }).fallbackLatestVersion
    ).toBe(false);
  });

  it('keeps boolean fallbackLatestVersion for SDK callers', () => {
    const query = ToolGetParamsDTOSchema.parse({
      pluginId: 'getTime',
      fallbackLatestVersion: true
    });

    expect(query.fallbackLatestVersion).toBe(true);
  });
});
