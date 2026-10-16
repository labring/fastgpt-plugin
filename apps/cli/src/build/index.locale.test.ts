import { describe, expect, it } from 'vitest';

import { toManifestJsonSchema } from './index';

describe('manifest JSON Schema localization', () => {
  it('uses English compatibility strings while preserving localized metadata', () => {
    const schema = {
      type: 'object',
      properties: {
        query: {
          title: '旧标题',
          description: '旧说明',
          'x-i18n': {
            title: { en: 'Query', 'zh-CN': '查询' },
            description: { en: 'Search text', 'zh-CN': '搜索文本' }
          }
        },
        legacy: { title: 'Legacy title', description: 'Legacy description' }
      }
    };

    const result = toManifestJsonSchema(schema) as typeof schema;

    expect(result.properties.query).toEqual({
      title: 'Query',
      description: 'Search text',
      'x-i18n': {
        title: { en: 'Query', 'zh-CN': '查询' },
        description: { en: 'Search text', 'zh-CN': '搜索文本' }
      }
    });
    expect(result.properties.legacy).toEqual({
      title: 'Legacy title',
      description: 'Legacy description'
    });
  });
});
