import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'minimax 工具集',
    en: 'minimax Tool Set'
  },
  courseUrl: 'https://platform.minimaxi.com/document/quick_start',
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': 'minimax 工具集, 包含文本转语音、语音转文本、语音合成、语音识别等功能',
    en: 'minimax tool set, including text-to-speech, speech-to-text, speech synthesis, speech recognition等功能'
  },
  toolDescription:
    'minimax tool set, including text-to-speech, speech-to-text, speech synthesis, speech recognition等功能',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 minimax 官网获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
