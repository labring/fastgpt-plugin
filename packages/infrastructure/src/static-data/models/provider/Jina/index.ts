import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Jina',
  list: [
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v5-omni-small',
      defaultToken: 512,
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v5-text-small',
      defaultToken: 512,
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v5-omni-nano',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v5-text-nano',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v4',
      defaultToken: 512,
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-clip-v2',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v3',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'jina-reranker-v3',
      maxToken: 131072
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'jina-reranker-v2-base-multilingual',
      maxToken: 1024
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'jina-reranker-m0',
      maxToken: 10240
    }
  ]
};

export default models;
