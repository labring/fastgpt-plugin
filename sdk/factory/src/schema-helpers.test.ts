import { describe, expect, expectTypeOf, it } from 'vitest';
import z from 'zod';

import { createToolHandler, defineInputSchema, defineOutputSchema } from './index';

const text = (en: string, zhCN: string, zhHant?: string) => ({
  en,
  'zh-CN': zhCN,
  ...(zhHant !== undefined ? { 'zh-Hant': zhHant } : {})
});

describe('schema definition helpers', () => {
  it('keeps ordinary Zod parsing, defaults, nesting, and object behavior', () => {
    const inputSchema = defineInputSchema({
      query: { type: z.string().min(1), title: text('Query', '查询') },
      limit: { type: z.number().int().optional(), title: text('Limit', '数量') },
      page: { type: z.number().default(1), title: text('Page', '页码') },
      filters: {
        type: z.array(
          defineOutputSchema({
            tag: { type: z.string(), title: text('Tag', '标签') }
          })
        ),
        title: text('Filters', '筛选条件')
      }
    });

    expect(
      inputSchema.parse({ query: 'hello', filters: [{ tag: 'news', ignored: true }], ignored: true })
    ).toEqual({ query: 'hello', page: 1, filters: [{ tag: 'news' }] });
    expect(inputSchema.safeParse({ query: '', filters: [] }).success).toBe(false);
    expect(inputSchema.safeParse({ query: 'hello', limit: 1.5, filters: [] }).success).toBe(false);
    expect(inputSchema.safeParse({ filters: [] }).success).toBe(false);
    expect(inputSchema.parse({ query: 'hello', limit: 2, page: 3, filters: [] })).toEqual({
      query: 'hello',
      limit: 2,
      page: 3,
      filters: []
    });

    const outputSchema = defineOutputSchema({
      items: { type: z.array(z.string()), title: text('Items', '项目') }
    });
    expect(outputSchema.safeParse({ items: ['one'] }).success).toBe(true);
    expect(outputSchema.safeParse({ items: [1] }).success).toBe(false);
    expect(defineOutputSchema({}).parse({})).toEqual({});
  });

  it('merges descriptor metadata without mutating shared field schemas', () => {
    const oldI18n = {
      title: text('Old title', '旧标题'),
      description: text('Old description', '旧描述'),
      placeholder: text('Old placeholder', '旧占位符'),
      custom: { retained: true }
    };
    const shared = z.string().meta({
      title: 'Old title',
      description: 'Old description',
      placeholder: 'Schema placeholder',
      toolDescription: 'Old model description',
      isToolParam: true,
      examples: ['example'],
      deprecated: true,
      'x-i18n': oldI18n
    });
    const first = defineInputSchema({
      value: {
        type: shared,
        title: text('First title', '第一标题', '第一標題'),
        description: text('First description', '第一描述'),
        isToolParam: false
      }
    });
    const second = defineOutputSchema({
      value: { type: shared, title: text('Second title', '第二标题') }
    });

    expect(first.shape.value.meta()).toMatchObject({
      title: '第一标题',
      description: '第一描述',
      placeholder: 'Schema placeholder',
      isToolParam: false,
      examples: ['example'],
      deprecated: true,
      'x-i18n': {
        title: text('First title', '第一标题', '第一標題'),
        description: text('First description', '第一描述'),
        placeholder: oldI18n.placeholder,
        custom: { retained: true }
      }
    });
    expect(first.shape.value.meta()?.toolDescription).toBeUndefined();
    expect(second.shape.value.meta()).toMatchObject({
      title: '第二标题',
      placeholder: 'Schema placeholder',
      isToolParam: true,
      'x-i18n': {
        title: text('Second title', '第二标题'),
        description: oldI18n.description,
        placeholder: oldI18n.placeholder,
        custom: { retained: true }
      }
    });
    expect(second.shape.value.meta()?.toolDescription).toBeUndefined();
    expect(shared.meta()).toMatchObject({
      title: 'Old title',
      description: 'Old description',
      'x-i18n': oldI18n
    });
    expect(shared.meta()?.toolDescription).toBe('Old model description');
  });

  it('treats invalid x-i18n metadata as absent and preserves special field names', () => {
    const fields = {
      ['__proto__']: { type: z.string(), title: text('Prototype', '原型') }
    };
    const schema = defineInputSchema(fields);
    expect(Object.hasOwn(schema.shape, '__proto__')).toBe(true);
    expect(schema.shape['__proto__']?.meta()?.title).toBe('原型');

    const invalidI18nSchema = z.string().meta({ 'x-i18n': [] });
    const rebuilt = defineOutputSchema({
      field: { type: invalidI18nSchema, title: text('Field', '字段') }
    });
    expect(rebuilt.parse({ field: 'value' })).toEqual({ field: 'value' });
    expect(rebuilt.shape.field.meta()?.['x-i18n']).toEqual({ title: text('Field', '字段') });

    const emptyI18nSchema = z.string().meta({ 'x-i18n': {} });
    const rebuiltEmptyI18n = defineInputSchema({
      field: { type: emptyI18nSchema, title: text('Empty', '空') }
    });
    expect(rebuiltEmptyI18n.shape.field.meta()?.['x-i18n']).toEqual({ title: text('Empty', '空') });
  });

  it('preserves schema input/output inference through handler definitions', () => {
    const inputSchema = defineInputSchema({
      query: { type: z.string(), title: text('Query', '查询') },
      limit: { type: z.number().optional(), title: text('Limit', '数量') },
      page: { type: z.number().default(1), title: text('Page', '页码') },
      parsed: { type: z.string().transform(Number), title: text('Parsed', '已解析') },
      nested: {
        type: z.array(defineOutputSchema({ label: { type: z.string(), title: text('Label', '标签') } })),
        title: text('Nested', '嵌套')
      }
    });
    const outputSchema = defineOutputSchema({
      count: { type: z.number(), title: text('Count', '计数') }
    });

    expectTypeOf<z.input<typeof inputSchema>>().toEqualTypeOf<{
      query: string;
      limit?: number | undefined;
      page?: number | undefined;
      parsed: string;
      nested: { label: string }[];
    }>();
    expectTypeOf<z.output<typeof inputSchema>>().toEqualTypeOf<{
      query: string;
      limit?: number | undefined;
      page: number;
      parsed: number;
      nested: { label: string }[];
    }>();
    expectTypeOf<z.input<typeof outputSchema>>().toEqualTypeOf<{ count: number }>();
    expectTypeOf<z.output<typeof outputSchema>>().toEqualTypeOf<{ count: number }>();

    const handler = createToolHandler({
      inputSchema,
      outputSchema,
      handler: async (input) => ({ count: input.parsed + input.page })
    });
    expectTypeOf<Parameters<typeof handler.handler>[0]>().toEqualTypeOf<z.output<typeof inputSchema>>();
    // @ts-expect-error Handler results must satisfy the output schema.
    createToolHandler({ inputSchema, outputSchema, handler: async () => ({ count: 'not a number' }) });
  });
});

function assertDescriptorTypeRestrictions(): void {
  // @ts-expect-error Input descriptors require a title.
  defineInputSchema({ value: { type: z.string() } });
  // @ts-expect-error Title requires both English and Simplified Chinese.
  defineInputSchema({ value: { type: z.string(), title: { en: 'Value' } } });
  // @ts-expect-error Title requires English.
  defineInputSchema({ value: { type: z.string(), title: { 'zh-CN': '值' } } });
  // @ts-expect-error Input descriptors do not support placeholder.
  defineInputSchema({ value: { type: z.string(), title: text('Value', '值'), placeholder: text('Prompt', '提示') } });
  // @ts-expect-error Output descriptors do not support placeholder.
  defineOutputSchema({ value: { type: z.string(), title: text('Value', '值'), placeholder: text('Prompt', '提示') } });
  // @ts-expect-error Output descriptors do not support AI parameter hints.
  defineOutputSchema({ value: { type: z.string(), title: text('Value', '值'), isToolParam: false } });
}
