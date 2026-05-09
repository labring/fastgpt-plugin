import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'AliCloud',
  list: [
    {
      model: 'fun-asr',
      name: 'fun-asr',
      type: ModelTypeEnum.stt
    },
    {
      model: 'SenseVoiceSmall',
      name: 'SenseVoiceSmall',
      type: ModelTypeEnum.stt
    }
  ]
};

export default models;
