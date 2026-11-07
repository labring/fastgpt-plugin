import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Meta',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'muse-spark-1.3',
      maxContext: 1048576,
      maxTokens: 131072,
      quoteMaxToken: 960000,
      maxTemperature: 2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    }
  ]
};

export default models;
