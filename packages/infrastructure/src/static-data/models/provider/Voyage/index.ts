import { ModelTypeEnum, type ProviderConfigType } from '../../type';

// Voyage AI models, served by the AI Proxy `voyage` channel (type 60).
// `input_type` is set per usage so that stored chunks and search queries get the matching retrieval prompt.
// Voyage returns 1024-dimensional vectors by default; FastGPT zero-pads them to its fixed vector size.
const documentConfig = { input_type: 'document' };
const queryConfig = { input_type: 'query' };

// voyage-context-* models are contextualized embeddings: every input is one document that AI Proxy sends
// auto-chunked at 32000 tokens, so maxToken stays below that window to keep one vector per input.
// Voyage rejects a request without input_type for these models, so the default is `document` and
// dbConfig/queryConfig override it per usage (the model test sends no usage type).
const contextualDefaultConfig = { input_type: 'document' };

const models: ProviderConfigType = {
  provider: 'Voyage',
  list: [
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-4-large',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-4',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-4-lite',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-code-4',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-3-large',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-3.5',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-3.5-lite',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-code-3',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-finance-2',
      defaultToken: 512,
      maxToken: 32000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-law-2',
      defaultToken: 512,
      maxToken: 16000,
      vision: false,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-context-4',
      defaultToken: 512,
      maxToken: 30000,
      vision: false,
      defaultConfig: contextualDefaultConfig,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-context-3',
      defaultToken: 512,
      maxToken: 30000,
      vision: false,
      defaultConfig: contextualDefaultConfig,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-multimodal-3.5',
      defaultToken: 512,
      maxToken: 32000,
      vision: true,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'voyage-multimodal-3',
      defaultToken: 512,
      maxToken: 32000,
      vision: true,
      dbConfig: documentConfig,
      queryConfig
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'rerank-3',
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'rerank-3-lite',
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'rerank-2.5',
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'rerank-2.5-lite',
      maxToken: 32000
    }
  ]
};

export default models;
