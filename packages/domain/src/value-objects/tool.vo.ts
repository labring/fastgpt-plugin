import z from 'zod';

import { PluginSourceSchema } from './plugin.vo';
import { SystemVarSchema } from './system-var.vo';

/**
 * 工具 handler 返回的结构化内容部分,与 FastGPT 主程序对齐:
 * text 为纯文本,image_url 为图片;主程序会把合法的 content parts 作为下一轮模型的视觉输入。
 *
 * 注意:发给模型的 tool 文本始终是 handler 返回值的完整序列化结果,
 * content 里的 text part 不会替换这段文本(主程序只取其中的图片 part)。
 * 需要模型看到业务字段时,把字段放在返回对象顶层;content 主要用于携带图片。
 *
 * 该 schema 供插件作者在 outputSchema 中声明使用,不参与 wire 层强校验。
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
 * 工具 handler 返回对象的 wire 契约:保持任意 JSON 透传,与历史版本一致。
 *
 * content 字段不做结构化强校验,插件返回的 content 可以是任意业务值
 * (字符串、对象、数组等),旧插件输出不受影响。需要向模型传递结构化内容时,
 * 按约定将 content 声明并返回为 ToolMessageContentPartType[](text / image_url parts);
 * FastGPT 主程序仅在 content 形状合法时把它作为视觉输入,否则回退到普通文本路径。
 */
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
