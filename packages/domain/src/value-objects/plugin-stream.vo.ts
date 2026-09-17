import z from 'zod';

/**
 * 插件通道的流帧线格式。
 *
 * 这是**通道传输概念**（debug gateway / sdk-client / local-pool 共用同一份线格式），
 * 不属于任何单一插件类型，因此定义在插件级文件里，由各类插件共用。
 */

/** 插件事件处理器的返回值载荷（无类型信封），具体形状由各业务 schema 校验 */
export const PluginStreamResponseDataSchema = z.record(z.string(), z.unknown());
export type PluginStreamResponseDataType = z.infer<typeof PluginStreamResponseDataSchema>;

export const StreamMessageTypeSchema = z.enum(['response', 'error', 'stream']);
export const StreamMessageTypeEnum = StreamMessageTypeSchema.enum;

export const StreamDataAnswerTypeSchema = z.enum(['answer', 'fastAnswer']);
export const StreamDataAnswerTypeEnum = StreamDataAnswerTypeSchema.enum;

/** `stream` 帧承载面向模型的可见文本（目前仅 tool 通道产出） */
export const PluginStreamAnswerSchema = z.object({
  type: StreamDataAnswerTypeSchema,
  content: z.string()
});

export type PluginStreamAnswerType = z.infer<typeof PluginStreamAnswerSchema>;

export const PluginStreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.response),
    data: PluginStreamResponseDataSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.stream),
    data: PluginStreamAnswerSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.error),
    data: z.string()
  })
]);

export type PluginStreamMessageType = z.infer<typeof PluginStreamMessageSchema>;
