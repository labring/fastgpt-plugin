import { z } from 'zod';

import {
  EmbeddingModelItemSchema,
  LLMModelItemSchema,
  ModelTypeEnum,
  RerankModelItemSchema,
  STTModelSchema,
  TTSModelSchema
} from '@domain/entities/model.entity';
import type { I18nStringStrictType } from '@domain/value-objects/i18n-string.vo';

// ==================== Module-specific Schemas ====================

export const ConfigModelItemSchema = z.discriminatedUnion('type', [
  LLMModelItemSchema.omit({
    provider: true
  }).extend({
    name: z.string().optional()
  }),
  EmbeddingModelItemSchema.omit({
    provider: true
  }).extend({
    name: z.string().optional()
  }),
  RerankModelItemSchema.omit({
    provider: true
  }).extend({
    name: z.string().optional()
  }),
  TTSModelSchema.omit({
    provider: true
  }).extend({
    name: z.string().optional()
  }),
  STTModelSchema.omit({
    provider: true
  }).extend({
    name: z.string().optional()
  })
]);

export const ProviderConfigSchema = z.object({
  provider: z.string(),
  list: z.array(ConfigModelItemSchema)
});
export type ProviderConfigType = z.infer<typeof ProviderConfigSchema>;

export { ModelTypeEnum };

export type AIProxyChannelsType = {
  channelId: number;
  name: I18nStringStrictType;
  avatar: string;
}[];
