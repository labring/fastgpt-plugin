import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'BAAI',
  list: [
    {
      type: ModelTypeEnum.embedding,
      model: 'bge-m3',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'bge-reranker-v2-m3'
    }
  ]
};

export default models;
