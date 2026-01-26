import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'minmax 文本转语音',
    en: 'minmax Text-to-Speech'
  },
  description: {
    'zh-CN': '使用MinMax平台将文本转换为高质量语音',
    en: 'Convert text to high-quality speech using MinMax platform'
  },
  toolDescription:
    'Convert text to speech using MinMax TTS API. Supports multiple voice settings and audio formats.',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'text',
          label: '文本内容',
          toolDescription: '文本内容',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'model',
          label: '模型',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: 'speech-2.5-hd-preview',
          list: [
            { label: 'speech-2.5-hd-preview', value: 'speech-2.5-hd-preview' },
            { label: 'speech-2.5-turbo-preview', value: 'speech-2.5-turbo-preview' },
            { label: 'speech-02-hd', value: 'speech-02-hd' },
            { label: 'speech-02-turbo', value: 'speech-02-turbo' },
            { label: 'speech-01-hd', value: 'speech-01-hd' },
            { label: 'speech-01-turbo', value: 'speech-01-turbo' }
          ]
        },
        {
          key: 'voice_id',
          label: '音色',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: 'male-qn-qingse',
          list: [
            {
              label: '青涩青年音色',
              value: 'male-qn-qingse'
            },
            {
              label: '精英青年音色',
              value: 'male-qn-jingying'
            },
            {
              label: '少女音色',
              value: 'female-shaonv'
            },
            {
              label: '成熟女性音色',
              value: 'female-chengshu'
            }
          ]
        },
        {
          key: 'speed',
          label: '语速',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: true,
          description: '语速，范围为 0.5-2, 值越大语速越快',
          min: 0.5,
          max: 2,
          step: 0.1,
          defaultValue: 1
        },
        {
          key: 'vol',
          label: '音量',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: true,
          description: '音量，范围为 0.1-10, 值越大音量越大',
          min: 0.1,
          max: 10,
          step: 0.1,
          defaultValue: 1
        },
        {
          key: 'pitch',
          label: '语调',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          required: true,
          description: '语调，范围为 -12-12, 值越大语调越高',
          min: -12,
          max: 12,
          step: 1,
          defaultValue: 0
        },
        {
          key: 'emotion',
          label: '情绪',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: '',
          list: [
            { label: '自动', value: '' },
            { label: '高兴', value: 'happy' },
            { label: '悲伤', value: 'sad' },
            { label: '愤怒', value: 'angry' },
            { label: '害怕', value: 'fearful' },
            { label: '厌恶', value: 'disgusted' },
            { label: '惊讶', value: 'surprised' },
            { label: '中性', value: 'calm' }
          ]
        },
        {
          key: 'english_normalization',
          label: '英文规范化',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          description: '支持英语文本规范化，开启后可提升数字阅读场景的性能，但会略微增加延迟',
          required: true,
          defaultValue: false
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'audioUrl',
          label: '音频链接',
          description: '语音合成后的音频文件链接'
        }
      ]
    }
  ]
});
