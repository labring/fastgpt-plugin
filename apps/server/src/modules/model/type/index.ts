import { ModelTypeEnum } from '@fastgpt-plugin/helpers/models/schemas';
import { z } from 'zod';

import {
  EmbeddingModelItemSchema,
  ListModelsSchema,
  type ListModelsType,
  LLMModelItemSchema,
  ModelItemSchema,
  type ModelItemType,
  RerankModelItemSchema,
  STTModelSchema,
  TTSModelSchema} from '../schemas';

export {
  EmbeddingModelItemSchema,
  ListModelsSchema,
  type ListModelsType,
  LLMModelItemSchema,
  ModelItemSchema,
  type ModelItemType,
  ModelTypeEnum,
  RerankModelItemSchema,
  STTModelSchema,
  TTSModelSchema};

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
