import z from 'zod';

import { I18nStringStrictSchema } from '../value-objects/i18n-string.vo';

// 模型类型枚举
export const ModelTypeSchema = z.enum(['llm', 'embedding', 'rerank', 'tts', 'stt']);
export const ModelTypeEnum = ModelTypeSchema.enum;

// 价格类型 schema
const PriceSchema = z.object({
  charsPointsPrice: z.number().optional(), // 1k chars=n points; 60s=n points
  inputPrice: z.number().optional(), // 1k tokens=n points
  outputPrice: z.number().optional() // 1k tokens=n points
});

// 基础模型项类型 schema
const BaseModelItemSchema = z.object({
  provider: z.string(),
  model: z.string(),
  name: z.string()
});

// LLM 模型类型 schema
export const LLMModelItemSchema = z.object({
  ...PriceSchema.shape,
  ...BaseModelItemSchema.shape,
  type: z.literal(ModelTypeEnum.llm),
  // Model params
  maxContext: z.number(),
  maxTokens: z.number(),
  quoteMaxToken: z.number(),
  maxTemperature: z.union([z.number(), z.null()]),

  showTopP: z.boolean().optional(),
  responseFormatList: z.array(z.string()).optional(),
  showStopSign: z.boolean().optional(),

  censor: z.boolean().optional(),
  vision: z.boolean(),
  reasoning: z.boolean(),
  toolChoice: z.boolean(),

  // diff function model
  datasetProcess: z.boolean().optional(), // dataset
  usedInClassify: z.boolean().optional(), // classify
  usedInExtractFields: z.boolean().optional(), // extract fields
  usedInToolCall: z.boolean().optional(), // tool call
  useInEvaluation: z.boolean().optional(), // evaluation

  defaultSystemChatPrompt: z.string().optional(),
  defaultConfig: z.record(z.string(), z.any()).optional(),
  fieldMap: z.record(z.string(), z.string()).optional()
});

export type LLMModelItemType = z.infer<typeof LLMModelItemSchema>;
// Embedding 模型类型 schema
export const EmbeddingModelItemSchema = z.object({
  ...PriceSchema.shape,
  ...BaseModelItemSchema.shape,
  type: z.literal(ModelTypeEnum.embedding),
  defaultToken: z.number(), // split text default token
  maxToken: z.number(), // model max token
  weight: z.number().optional(), // training weight
  hidden: z.boolean().optional(), // Disallow creation
  normalization: z.boolean().optional(), // normalization processing
  defaultConfig: z.record(z.string(), z.any()).optional(), // post request config
  dbConfig: z.record(z.string(), z.any()).optional(), // Custom parameters for storage
  queryConfig: z.record(z.string(), z.any()).optional() // Custom parameters for query
});

export type EmbeddingModelItemType = z.infer<typeof EmbeddingModelItemSchema>;

// Rerank 模型类型 schema
export const RerankModelItemSchema = z.object({
  ...PriceSchema.shape,
  ...BaseModelItemSchema.shape,
  type: z.literal(ModelTypeEnum.rerank)
});

export type RerankModelItemType = z.infer<typeof RerankModelItemSchema>;

// TTS 模型类型 schema
export const TTSModelSchema = z.object({
  ...PriceSchema.shape,
  ...BaseModelItemSchema.shape,
  type: z.literal(ModelTypeEnum.tts),
  voices: z.array(
    z.object({
      label: z.string(),
      value: z.string()
    })
  )
});

export type TTSModelItemType = z.infer<typeof TTSModelSchema>;

// STT 模型类型 schema
export const STTModelSchema = z.object({
  ...PriceSchema.shape,
  ...BaseModelItemSchema.shape,
  type: z.literal(ModelTypeEnum.stt)
});

export type STTModelItemType = z.infer<typeof STTModelSchema>;

export const ModelItemSchema = z.discriminatedUnion('type', [
  LLMModelItemSchema,
  EmbeddingModelItemSchema,
  RerankModelItemSchema,
  TTSModelSchema,
  STTModelSchema
]);

export type ModelItemType = z.infer<typeof ModelItemSchema>;

export const ModelProviderSchema = z.object({
  id: z.string(),
  name: I18nStringStrictSchema,
  avatar: z.string()
});

export type ModelProviderType = z.infer<typeof ModelProviderSchema>;
