import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'Siliconflow',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'Qwen/Qwen2.5-72B-Instruct',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Qwen/Qwen2-VL-72B-Instruct',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      censor: false,
      vision: true,
      reasoning: false,
      toolChoice: false,
      datasetProcess: false,
      usedInClassify: false,
      usedInExtractFields: false,
      usedInToolCall: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-ai/DeepSeek-V2.5',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'BAAI/bge-m3',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.tts,
      model: 'FunAudioLLM/CosyVoice2-0.5B',
      voices: [
        { label: 'alex', value: 'FunAudioLLM/CosyVoice2-0.5B:alex' },
        { label: 'anna', value: 'FunAudioLLM/CosyVoice2-0.5B:anna' },
        { label: 'bella', value: 'FunAudioLLM/CosyVoice2-0.5B:bella' },
        { label: 'benjamin', value: 'FunAudioLLM/CosyVoice2-0.5B:benjamin' },
        { label: 'charles', value: 'FunAudioLLM/CosyVoice2-0.5B:charles' },
        { label: 'claire', value: 'FunAudioLLM/CosyVoice2-0.5B:claire' },
        { label: 'david', value: 'FunAudioLLM/CosyVoice2-0.5B:david' },
        { label: 'diana', value: 'FunAudioLLM/CosyVoice2-0.5B:diana' }
      ]
    },
    {
      type: ModelTypeEnum.tts,
      model: 'RVC-Boss/GPT-SoVITS',
      voices: [
        { label: 'alex', value: 'RVC-Boss/GPT-SoVITS:alex' },
        { label: 'anna', value: 'RVC-Boss/GPT-SoVITS:anna' },
        { label: 'bella', value: 'RVC-Boss/GPT-SoVITS:bella' },
        { label: 'benjamin', value: 'RVC-Boss/GPT-SoVITS:benjamin' },
        { label: 'charles', value: 'RVC-Boss/GPT-SoVITS:charles' },
        { label: 'claire', value: 'RVC-Boss/GPT-SoVITS:claire' },
        { label: 'david', value: 'RVC-Boss/GPT-SoVITS:david' },
        { label: 'diana', value: 'RVC-Boss/GPT-SoVITS:diana' }
      ]
    },
    {
      type: ModelTypeEnum.tts,
      model: 'fishaudio/fish-speech-1.5',
      voices: [
        { label: 'alex', value: 'fishaudio/fish-speech-1.5:alex' },
        { label: 'anna', value: 'fishaudio/fish-speech-1.5:anna' },
        { label: 'bella', value: 'fishaudio/fish-speech-1.5:bella' },
        { label: 'benjamin', value: 'fishaudio/fish-speech-1.5:benjamin' },
        { label: 'charles', value: 'fishaudio/fish-speech-1.5:charles' },
        { label: 'claire', value: 'fishaudio/fish-speech-1.5:claire' },
        { label: 'david', value: 'fishaudio/fish-speech-1.5:david' },
        { label: 'diana', value: 'fishaudio/fish-speech-1.5:diana' }
      ]
    },
    {
      type: ModelTypeEnum.stt,
      model: 'FunAudioLLM/SenseVoiceSmall'
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'BAAI/bge-reranker-v2-m3'
    }
  ]
};

export default models;
