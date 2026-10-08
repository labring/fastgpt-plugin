import z from 'zod';

import { PluginSourceSchema } from './plugin.vo';
import { SystemVarSchema } from './system-var.vo';

/**
 * 工具 handler 返回的结构化内容部分,与 FastGPT 主程序对齐:
 * text 为纯文本,image_url 为图片;主程序会把合法的 content 作为下一轮模型的视觉输入。
 */
export const ToolMessageContentPartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().min(1)
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({
      url: z.string().min(1),
      detail: z.enum(['auto', 'low', 'high']).optional()
    })
  })
]);

export type ToolMessageContentPartType = z.infer<typeof ToolMessageContentPartSchema>;

/**
 * 工具 handler 返回对象的结构契约:
 * 普通输出字段保持任意 JSON;当包含 content 字段时,必须是
 * ToolMessageContentPartType[](text / image_url 结构化内容),
 * 不允许用 content 传字符串等非结构化内容。
 */
export const ToolHandlerReturnSchema = z
  .object({
    content: z.array(ToolMessageContentPartSchema).optional()
  })
  .catchall(z.unknown());
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
