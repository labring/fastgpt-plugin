import z from 'zod';

import { I18nStringStrictSchema } from '../value-objects/i18n-string.vo';

// 模型类型枚举
export const ModelTypeSchema = z.enum(['llm', 'embedding', 'rerank', 'tts', 'stt']);
export const ModelTypeEnum = ModelTypeSchema.enum;

// 价格单位。价格数字统一使用人民币（CNY）。
// `tokens_per_1m` 表示元 / 1M tokens，`characters_per_1m` 表示元 / 1M 字符，
// `seconds_per_60` 表示元 / 60 秒。具体模型可以覆盖默认单位，例如按 Token 计费的 STT。
export const ModelPriceBillingUnitSchema = z.enum([
  'tokens_per_1m',
  'characters_per_1m',
  'seconds_per_60'
]);

export type ModelPriceBillingUnitType = z.infer<typeof ModelPriceBillingUnitSchema>;

// 价格梯度 schema
// 保留 FastGPT 的字段命名和梯度规则：第一档从 0 开始，后续档位的下界由上一档
// maxInputTokens 推导。maxInputTokens 始终使用完整的 Token 数量（例如 200000），
// 不做千 Token 缩写；inputPrice/outputPrice 是人民币单价，分母由 billingUnit 决定。
export const ModelPriceTierSchema = z.object({
  minInputTokens: z.number().min(0).optional(),
  maxInputTokens: z.number().min(0).nullish(),
  inputPrice: z.number().min(0),
  outputPrice: z.number().min(0)
});

export type ModelPriceTierType = z.infer<typeof ModelPriceTierSchema>;

// 价格类型 schema
const PriceSchema = z.object({
  // 价格均为人民币；最终静态模型列表会补齐这两个字段。
  priceCurrency: z.literal('CNY').optional(),
  billingUnit: ModelPriceBillingUnitSchema.optional(),
  // 梯度价格字段。空数组表示尚未配置价格，不代表免费。
  priceTiers: z.array(ModelPriceTierSchema).optional()
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
  maxTemperature: z.number().optional(),

  showTopP: z.boolean().optional(),
  responseFormatList: z.array(z.string()).optional(),
  showStopSign: z.boolean().optional(),

  censor: z.boolean().optional(),
  vision: z.boolean(),
  audio: z.boolean().optional(),
  video: z.boolean().optional(),
  reasoning: z.boolean(),
  reasoningEffort: z.boolean(),
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
  vision: z.boolean().optional(),
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
  type: z.literal(ModelTypeEnum.rerank),
  maxToken: z.number()
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
