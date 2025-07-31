import { z } from 'zod';

// 模型类型枚举
export enum ModelTypeEnum {
  llm = 'llm',
  embedding = 'embedding',
  rerank = 'rerank',
  tts = 'tts',
  stt = 'stt'
}

// 价格类型 schema
const PriceSchema = z.object({
  charsPointsPrice: z.number().optional(), // 1k chars=n points; 60s=n points
  inputPrice: z.number().optional(), // 1k tokens=n points
  outputPrice: z.number().optional() // 1k tokens=n points
});
export type PriceType = z.infer<typeof PriceSchema>;

// 基础模型项类型 schema
const BaseModelItemSchema = z.object({
  provider: z.string(),
  model: z.string(),
  name: z.string()
});

// LLM 模型类型 schema
export const LLMModelItemSchema = PriceSchema.merge(BaseModelItemSchema).extend({
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
  defaultConfig: z.record(z.any()).optional(),
  fieldMap: z.record(z.string()).optional()
});

// Embedding 模型类型 schema
export const EmbeddingModelItemSchema = PriceSchema.merge(BaseModelItemSchema).extend({
  type: z.literal(ModelTypeEnum.embedding),
  defaultToken: z.number(), // split text default token
  maxToken: z.number(), // model max token
  weight: z.number().optional(), // training weight
  hidden: z.boolean().optional(), // Disallow creation
  normalization: z.boolean().optional(), // normalization processing
  defaultConfig: z.record(z.any()).optional(), // post request config
  dbConfig: z.record(z.any()).optional(), // Custom parameters for storage
  queryConfig: z.record(z.any()).optional() // Custom parameters for query
});

// Rerank 模型类型 schema
export const RerankModelItemSchema = PriceSchema.merge(BaseModelItemSchema).extend({
  type: z.literal(ModelTypeEnum.rerank)
});

// TTS 模型类型 schema
export const TTSModelSchema = PriceSchema.merge(BaseModelItemSchema).extend({
  type: z.literal(ModelTypeEnum.tts),
  voices: z.array(
    z.object({
      label: z.string(),
      value: z.string()
    })
  )
});

// STT 模型类型 schema
export const STTModelSchema = PriceSchema.merge(BaseModelItemSchema).extend({
  type: z.literal(ModelTypeEnum.stt)
});

// 联合类型 schema - 使用 discriminated union 以支持类型推断
export const ModelItemSchema = z.discriminatedUnion('type', [
  LLMModelItemSchema,
  EmbeddingModelItemSchema,
  RerankModelItemSchema,
  TTSModelSchema,
  STTModelSchema
]);

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
