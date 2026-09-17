import z from 'zod';

import {
  ModerationModalitySchema
} from '../value-objects/moderation.vo';

import { PluginBaseSchema, PluginTypeEnum } from './plugin-base.entity';

export const ModerationMetaSchema = z.object({
  /** provider 标识，如 'baidu' | 'aliyun' */
  provider: z.string().min(1),
  /** 该 provider 实现的模态。宿主据此交叉校验请求的 `modality` */
  modalities: z.array(ModerationModalitySchema).min(1),
  /** provider 文档地址，仅展示用 */
  docUrl: z.string().optional()
});

export type ModerationMetaType = z.infer<typeof ModerationMetaSchema>;

export const ModerationSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.moderation),
  secretSchema: z.any().optional(),
  meta: ModerationMetaSchema
});

export type ModerationType = z.output<typeof ModerationSchema>;
