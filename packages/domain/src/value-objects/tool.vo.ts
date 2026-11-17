import z from 'zod';

import { PluginSourceSchema } from './plugin.vo';
import { SystemVarSchema } from './system-var.vo';

export const MODEL_CONTENT_SCHEMA_KIND = 'model-content' as const;
export const MODEL_CONTENT_SCHEMA_META_KEY = 'x-fastgpt-output-kind' as const;

export const ContentPartSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string().min(1).refine((url) => {
      if (/^data:image\/[^;,]+;base64,[^,]+$/i.test(url)) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Tool image url must be an http(s) URL or base64 image data URI'),
    detail: z.enum(['auto', 'low', 'high']).optional()
  })
});

/** 定义模型可消费图片、工作流可直接消费 value 的输出字段。 */
export const defineContentSchema = <T extends z.ZodType>(valueType: T) =>
  z.object({ value: valueType, images: z.array(ContentPartSchema) }).meta({
    [MODEL_CONTENT_SCHEMA_META_KEY]: MODEL_CONTENT_SCHEMA_KIND
  });

export type ContentPart = z.infer<typeof ContentPartSchema>;

/** @deprecated 旧 content 数组格式；新工具请使用 defineContentSchema。 */
export const ToolMessageContentPartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().min(1)
  }),
  ContentPartSchema
]);

export type ToolMessageContentPartType = z.infer<typeof ToolMessageContentPartSchema>;

/** 工具返回值在 wire 层按普通业务对象透传。 */
export const ToolHandlerReturnSchema = z.record(z.string(), z.unknown());
export type ToolHandlerReturnType = z.infer<typeof ToolHandlerReturnSchema>;

export const StreamMessageTypeSchema = z.enum(['response', 'error', 'stream']);
export const StreamMessageTypeEnum = StreamMessageTypeSchema.enum;

export const StreamDataAnswerTypeSchema = z.enum(['answer', 'fastAnswer']);
export const StreamDataAnswerTypeEnum = StreamDataAnswerTypeSchema.enum;

export const ToolAnswerSchema = z.object({
  type: StreamDataAnswerTypeSchema,
  content: z.string()
});

export type ToolAnswerType = z.infer<typeof ToolAnswerSchema>;

export const ToolStreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.response),
    data: ToolHandlerReturnSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.stream),
    data: ToolAnswerSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.error),
    data: z.string()
  })
]);

export type ToolStreamMessageType = z.infer<typeof ToolStreamMessageSchema>;

export const ToolRunInputSchema = z.object({
  pluginId: z.string(),
  version: z.preprocess((value) => {
    if (value === '') return undefined;
    return value;
  }, z.string().optional()),
  source: PluginSourceSchema.optional(),
  childId: z.string().optional(), // 工具集时存在
  input: z.record(z.string(), z.unknown()),
  secrets: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarSchema
});

export type ToolRunInputType = z.infer<typeof ToolRunInputSchema>;
