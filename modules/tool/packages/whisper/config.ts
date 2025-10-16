import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Whisper 语音转文字',
    en: 'Whisper Speech-to-Text'
  },
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': '使用 OpenAI Whisper 模型将音频文件转换为文字，支持多种音频格式和多语言识别',
    en: 'Convert audio files to text using OpenAI Whisper model, supporting multiple audio formats and multilingual recognition'
  },
  courseUrl: 'https://api-gpt-ge.apifox.cn/283206615e0',
  icon: 'common/openai',
  toolDescription:
    'Convert audio files to text using OpenAI Whisper speech recognition API. Supports multiple audio formats and languages.',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '在 V-API 平台获取 API Key',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'file',
          label: '音频文件',
          toolDescription:
            '音频文件，支持 URL 或 base64 格式。URL 格式如：https://example.com/audio.mp3，base64 格式如：data:audio/mp3;base64,xxx...',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          placeholder: '输入音频文件 URL 或 base64 数据'
        },
        {
          key: 'model',
          label: '模型',
          toolDescription: 'Whisper model to use for transcription',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: 'whisper-large-v3-turbo',
          list: [{ label: 'whisper-large-v3-turbo', value: 'whisper-large-v3-turbo' }]
        },
        {
          key: 'language',
          label: '音频语言',
          toolDescription:
            'Language of the input audio, if specified the model will perform better',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: 'zh',
          list: [
            { label: '中文', value: 'zh' },
            { label: '英语', value: 'en' },
            { label: '德语', value: 'de' },
            { label: '西班牙语', value: 'es' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'text',
          label: '转录文本',
          description: '音频转录后的文本内容'
        }
      ]
    }
  ]
});
