import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': 'Whisper 语音转文字',
    en: 'Whisper Speech-to-Text'
  },
  tags: [ToolTagEnum.enum.multimodal],
  description: {
    'zh-CN': '使用 OpenAI Whisper 模型将音频文件转换为文字，支持多种音频格式和多语言识别',
    en: 'Convert audio files to text using OpenAI Whisper model, supporting multiple audio formats and multilingual recognition'
  },
  courseUrl: 'https://platform.openai.com/docs/pricing',
  icon: 'common/openai',
  toolDescription:
    'Convert audio files to text using OpenAI Whisper speech recognition API. Supports multiple audio formats and languages.',
  secretInputConfig: [
    {
      key: 'baseUrl',
      label: 'BaseUrl',
      inputType: 'input',
      description: '默认为：https://api.openai.com/v1',
      defaultValue: 'https://api.openai.com/v1'
    },
    {
      key: 'apiKey',
      label: 'API Key',
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
          key: 'model',
          label: '模型',
          toolDescription: 'Whisper model to use for transcription',
          renderTypeList: [
            FlowNodeInputTypeEnum.select,
            FlowNodeInputTypeEnum.input,
            FlowNodeInputTypeEnum.reference
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          defaultValue: 'whisper-1',
          list: [
            { label: 'whisper-1', value: 'whisper-1' },
            { label: 'gpt-4o-transcribe', value: 'gpt-4o-transcribe' },
            { label: 'gpt-4o-mini-transcribe', value: 'gpt-4o-mini-transcribe' },
            { label: 'gpt-4o-transcribe-diarize', value: 'gpt-4o-transcribe-diarize' }
          ]
        },
        {
          key: 'file',
          label: '音频文件',
          toolDescription:
            '音频文件，支持 URL 或 base64 格式。URL 格式如：https://example.com/audio.mp3，base64 格式如：data:audio/mp3;base64,xxx...',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          placeholder: '输入音频文件 URL 或 base64 数据'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'text',
          label: '文本'
        }
      ]
    }
  ]
});
