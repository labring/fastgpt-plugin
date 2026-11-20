import { describe, expect, it } from 'vitest';
import z from 'zod';

import { defineContentSchema, defineOutputSchema } from '../../../../sdk/factory/src/index';

import { toManifestJsonSchema } from './index';

describe('manifest JSON Schema localization', () => {
  it('preserves multimodal markers and value types in the built manifest', () => {
    const output = defineOutputSchema({
      results: {
        type: defineContentSchema(z.array(z.object({ id: z.string() }))),
        title: { en: 'Results', 'zh-CN': '结果' }
      }
    });
    const schema = z.toJSONSchema(output);
    const manifest = toManifestJsonSchema(schema) as typeof schema;
    expect(manifest.properties?.results).toMatchObject({
      type: 'object',
      'x-fastgpt-output-kind': 'model-content',
      properties: { value: { type: 'array', items: { type: 'object' } }, images: { type: 'array' } }
    });
  });

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
