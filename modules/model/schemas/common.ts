import { z } from '@hono/zod-openapi';
import {
  LLMModelItemSchema as BaseLLMModelItemSchema,
  EmbeddingModelItemSchema as BaseEmbeddingModelItemSchema,
  RerankModelItemSchema as BaseRerankModelItemSchema,
  TTSModelSchema as BaseTTSModelSchema,
  STTModelSchema as BaseSTTModelSchema,
  type ModelItemType,
  type ListModelsType
} from '@/validates/model';

// Re-export types
export { type ModelItemType, type ListModelsType };

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

// I18n string schema (OpenAPI compatible)
const I18nStringStrictSchema = z.object({
  en: z.string(),
  'zh-CN': z.string(),
  'zh-Hant': z.string()
});

// ==================== Provider Schemas ====================

// Model provider schema for API response
export const ModelProviderResponseSchema = z.object({
  provider: z.string().openapi({ example: 'openai' }),
  value: I18nStringStrictSchema,
  avatar: z.string().openapi({ example: 'https://example.com/avatar.png' })
});

// AIProxy channel entry schema
export const AIProxyChannelSchema = z.object({
  channelId: z.number(),
  name: z.union([z.string(), I18nStringStrictSchema]),
  avatar: z.string()
});

// AIProxy channels list schema
export const AIProxyChannelsSchema = z.array(AIProxyChannelSchema);

// Get providers response schema
export const GetProvidersResponseSchema = z.object({
  modelProviders: z.array(ModelProviderResponseSchema),
  aiproxyChannels: AIProxyChannelsSchema
});
