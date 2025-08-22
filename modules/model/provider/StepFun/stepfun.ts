import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'StepFun',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'step-1-flash',
      maxContext: 8000,
      maxTokens: 4000,
      quoteMaxToken: 6000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1-8k',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1-32k',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1-128k',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1-256k',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 256000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1o-vision-32k',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1v-8k',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-1v-32k',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-2-mini',
      maxContext: 8000,
      maxTokens: 4000,
      quoteMaxToken: 6000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-2-16k',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 4000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'step-2-16k-exp',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 4000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.tts,
      model: 'step-tts-mini',
      voices: [
        { label: 'cixingnansheng', value: 'cixingnansheng' },
        { label: 'zhengpaiqingnian', value: 'zhengpaiqingnian' },
        { label: 'yuanqinansheng', value: 'yuanqinansheng' },
        { label: 'qingniandaxuesheng', value: 'qingniandaxuesheng' },
        { label: 'boyinnansheng', value: 'boyinnansheng' },
        { label: 'ruyananshi', value: 'ruyananshi' },
        { label: 'shenchennanyin', value: 'shenchennanyin' },
        { label: 'qinqienvsheng', value: 'qinqienvsheng' },
        { label: 'wenrounvsheng', value: 'wenrounvsheng' },
        { label: 'jilingshaonv', value: 'jilingshaonv' },
        { label: 'yuanqishaonv', value: 'yuanqishaonv' },
        { label: 'ruanmengnvsheng', value: 'ruanmengnvsheng' },
        { label: 'youyanvsheng', value: 'youyanvsheng' },
        { label: 'lengyanyujie', value: 'lengyanyujie' },
        { label: 'shuangkuaijiejie', value: 'shuangkuaijiejie' },
        { label: 'wenjingxuejie', value: 'wenjingxuejie' },
        { label: 'linjiajiejie', value: 'linjiajiejie' },
        { label: 'linjiameimei', value: 'linjiameimei' },
        { label: 'zhixingjiejie', value: 'zhixingjiejie' }
      ]
    }
  ]
};

export default models;
