import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'minmax 工具集',
    en: 'minmax Tool Set'
  },
  courseUrl: 'https://platform.minimaxi.com/document/quick_start',
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'minmax 工具集, 包含文本转语音、语音转文本、语音合成、语音识别等功能',
    en: 'minmax tool set, including text-to-speech, speech-to-text, speech synthesis, speech recognition等功能'
  },
  toolDescription:
    'minmax tool set, including text-to-speech, speech-to-text, speech synthesis, speech recognition等功能',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 minmax 官网获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
