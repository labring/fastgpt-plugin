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
      model: 'jina-reranker-v2-base-multilingual'
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'jina-reranker-m0'
    }
  ]
};

export default models;
