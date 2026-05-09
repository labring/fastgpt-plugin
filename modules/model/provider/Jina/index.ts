import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Jina',
  list: [
    {
      type: ModelTypeEnum.embedding,
      model: 'jina-embeddings-v3',
      defaultToken: 512,
      maxToken: 8000
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
