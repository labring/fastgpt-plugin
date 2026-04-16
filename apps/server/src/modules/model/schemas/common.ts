import type { ListModelsType, ModelItemType } from '@fastgpt-plugin/helpers/models/schemas';
import {
  EmbeddingModelItemSchema as BaseEmbeddingModelItemSchema,
  LLMModelItemSchema as BaseLLMModelItemSchema,
  RerankModelItemSchema as BaseRerankModelItemSchema,
  STTModelSchema as BaseSTTModelSchema,
  TTSModelSchema as BaseTTSModelSchema} from '@fastgpt-plugin/helpers/models/schemas';
import { z } from '@hono/zod-openapi';

// Re-export types
export { type ListModelsType,type ModelItemType };

// ==================== Model Schemas for API ====================
// Use z.object().extend() to convert standard zod schema to zod-openapi schema

export const LLMModelItemSchema = z.object(BaseLLMModelItemSchema.shape).openapi('LLMModelItem');
export const EmbeddingModelItemSchema = z
  .object(BaseEmbeddingModelItemSchema.shape)
  .openapi('EmbeddingModelItem');
export const RerankModelItemSchema = z
  .object(BaseRerankModelItemSchema.shape)
  .openapi('RerankModelItem');
export const TTSModelSchema = z.object(BaseTTSModelSchema.shape).openapi('TTSModel');
export const STTModelSchema = z.object(BaseSTTModelSchema.shape).openapi('STTModel');

// For discriminated union, we need to recreate it with zod-openapi's z
export const ModelItemSchema = z
  .discriminatedUnion('type', [
    LLMModelItemSchema,
    EmbeddingModelItemSchema,
    RerankModelItemSchema,
    TTSModelSchema,
    STTModelSchema
  ])
  .openapi('ModelItem');

export const ListModelsSchema = z.array(ModelItemSchema).openapi('ListModels');

// ==================== Provider Schemas ====================

// Model provider schema for API response
export const ModelProviderResponseSchema = z.object({
  provider: z.string().openapi({ example: 'openai' }),
  value: I18nStringStrictSchema,
  avatar: z.string().openapi({ example: 'https://example.com/avatar.png' })
});

// Aiproxy ID map entry schema
export const AiproxyIdMapEntrySchema = z.object({
  name: z.union([z.string(), I18nStringStrictSchema]),
  provider: z.string().optional(),
  avatar: z.string().optional()
});

// Aiproxy ID map schema (key is number as string)
export const AiproxyIdMapSchema = z.record(z.coerce.string(), AiproxyIdMapEntrySchema);

// Get providers response schema
export const GetProvidersResponseSchema = z.object({
  modelProviders: z.array(ModelProviderResponseSchema),
  aiproxyIdMap: AiproxyIdMapSchema
});
