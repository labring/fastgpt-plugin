import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const sambertVoices = [
  { label: 'sambert-beth-v1', value: 'sambert-beth-v1' },
  { label: 'sambert-betty-v1', value: 'sambert-betty-v1' },
  { label: 'sambert-brian-v1', value: 'sambert-brian-v1' },
  { label: 'sambert-cally-v1', value: 'sambert-cally-v1' },
  { label: 'sambert-camila-v1', value: 'sambert-camila-v1' },
  { label: 'sambert-cindy-v1', value: 'sambert-cindy-v1' },
  { label: 'sambert-clara-v1', value: 'sambert-clara-v1' },
  { label: 'sambert-donna-v1', value: 'sambert-donna-v1' },
  { label: 'sambert-eva-v1', value: 'sambert-eva-v1' },
  { label: 'sambert-hanna-v1', value: 'sambert-hanna-v1' },
  { label: 'sambert-indah-v1', value: 'sambert-indah-v1' },
  { label: 'sambert-perla-v1', value: 'sambert-perla-v1' },
  { label: 'sambert-waan-v1', value: 'sambert-waan-v1' },
  { label: 'sambert-zhichu-v1', value: 'sambert-zhichu-v1' },
  { label: 'sambert-zhida-v1', value: 'sambert-zhida-v1' },
  { label: 'sambert-zhide-v1', value: 'sambert-zhide-v1' },
  { label: 'sambert-zhifei-v1', value: 'sambert-zhifei-v1' },
  { label: 'sambert-zhigui-v1', value: 'sambert-zhigui-v1' },
  { label: 'sambert-zhihao-v1', value: 'sambert-zhihao-v1' },
  { label: 'sambert-zhijia-v1', value: 'sambert-zhijia-v1' },
  { label: 'sambert-zhijing-v1', value: 'sambert-zhijing-v1' },
  { label: 'sambert-zhilun-v1', value: 'sambert-zhilun-v1' },
  { label: 'sambert-zhimao-v1', value: 'sambert-zhimao-v1' },
  { label: 'sambert-zhimiao-emo-v1', value: 'sambert-zhimiao-emo-v1' },
  { label: 'sambert-zhiming-v1', value: 'sambert-zhiming-v1' },
  { label: 'sambert-zhimo-v1', value: 'sambert-zhimo-v1' },
  { label: 'sambert-zhina-v1', value: 'sambert-zhina-v1' },
  { label: 'sambert-zhinan-v1', value: 'sambert-zhinan-v1' },
  { label: 'sambert-zhiqi-v1', value: 'sambert-zhiqi-v1' },
  { label: 'sambert-zhiqian-v1', value: 'sambert-zhiqian-v1' },
  { label: 'sambert-zhiru-v1', value: 'sambert-zhiru-v1' },
  { label: 'sambert-zhishu-v1', value: 'sambert-zhishu-v1' },
  { label: 'sambert-zhishuo-v1', value: 'sambert-zhishuo-v1' },
  { label: 'sambert-zhistella-v1', value: 'sambert-zhistella-v1' },
  { label: 'sambert-zhiting-v1', value: 'sambert-zhiting-v1' },
  { label: 'sambert-zhiwei-v1', value: 'sambert-zhiwei-v1' },
  { label: 'sambert-zhixiang-v1', value: 'sambert-zhixiang-v1' },
  { label: 'sambert-zhixiao-v1', value: 'sambert-zhixiao-v1' },
  { label: 'sambert-zhiya-v1', value: 'sambert-zhiya-v1' },
  { label: 'sambert-zhiye-v1', value: 'sambert-zhiye-v1' },
  { label: 'sambert-zhiying-v1', value: 'sambert-zhiying-v1' },
  { label: 'sambert-zhiyuan-v1', value: 'sambert-zhiyuan-v1' },
  { label: 'sambert-zhiyue-v1', value: 'sambert-zhiyue-v1' }
];

const models: ProviderConfigType = {
  provider: 'AliCloud',
  list: [
    {
      type: ModelTypeEnum.tts,
      model: 'sambert-v1',
      voices: sambertVoices
    },
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
