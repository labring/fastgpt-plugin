import z from 'zod';

import { PluginBaseSchema, PluginTypeEnum } from './plugin-base.entity';

export const ModerationMetaSchema = z.object({
  /** provider 标识，如 'baidu' | 'aliyun' */
  provider: z.string().min(1),
  /** provider 文档地址，仅展示用 */
  docUrl: z.string().optional()
}).strict();

export type ModerationMetaType = z.infer<typeof ModerationMetaSchema>;

export const ModerationSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.moderation),
  secretSchema: z.any().optional(),
  meta: ModerationMetaSchema
});

export type ModerationType = z.output<typeof ModerationSchema>;
