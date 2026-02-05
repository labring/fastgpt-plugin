import { z } from 'zod';
import { ModelTypeEnum } from '@fastgpt-plugin/helpers/models/schemas';
import {
  LLMModelItemSchema,
  EmbeddingModelItemSchema,
  RerankModelItemSchema,
  TTSModelSchema,
  STTModelSchema,
  ModelItemSchema,
  ListModelsSchema,
  type ModelItemType,
  type ListModelsType
} from '../schemas';

export {
  ModelTypeEnum,
  LLMModelItemSchema,
  EmbeddingModelItemSchema,
  RerankModelItemSchema,
  TTSModelSchema,
  STTModelSchema,
  ModelItemSchema,
  ListModelsSchema,
  type ModelItemType,
  type ListModelsType
};

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
