import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'BAAI',
  list: [
    {
      type: ModelTypeEnum.embedding,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.1, outputPrice: 0 }],
      model: 'bge-m3',
      defaultToken: 512,
      maxToken: 8000,
      vision: false
    },
    {
      type: ModelTypeEnum.rerank,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.2, outputPrice: 0 }],
      model: 'bge-reranker-v2-m3',
      maxToken: 8192
    }
  ]
};

export default models;
