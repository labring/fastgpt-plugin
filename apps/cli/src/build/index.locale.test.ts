import { describe, expect, it } from 'vitest';
import z from 'zod';

import { defineInputSchema, Model } from '../../../../sdk/factory/src';

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

  it('preserves Model format metadata across z.toJSONSchema and toManifestJsonSchema', () => {
    const inputSchema = defineInputSchema({
      model: {
        type: Model,
        title: { en: 'Model', 'zh-CN': '模型' },
        description: { en: 'Model to invoke', 'zh-CN': '要调用的模型' }
      }
    });

    const manifestSchema = toManifestJsonSchema(z.toJSONSchema(inputSchema)) as {
      type: string;
      properties: Record<string, Record<string, unknown>>;
    };

    expect(manifestSchema.properties.model).toMatchObject({
      type: 'string',
      format: 'modelId',
      title: 'Model',
      description: 'Model to invoke',
      'x-i18n': {
        title: { en: 'Model', 'zh-CN': '模型' },
        description: { en: 'Model to invoke', 'zh-CN': '要调用的模型' }
      }
    });
  });
});
