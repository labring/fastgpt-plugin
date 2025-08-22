import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'AliCloud',
  list: [
    {
      model: 'SenseVoiceSmall',
      name: 'SenseVoiceSmall',
      type: ModelTypeEnum.stt
    }
  ]
};

export default models;
