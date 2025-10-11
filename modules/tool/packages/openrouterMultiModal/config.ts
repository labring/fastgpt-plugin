import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'OpenRouter 多模态',
    en: 'OpenRouter Multi-Modal'
  },
  courseUrl: 'https://openrouter.ai/docs/quickstart',
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': '这是一个OpenRouter 多模态工具集，支持调用多种OpenRouter平台提供的模型服务',
    en: 'This is an OpenRouter multi-modal tool set, supporting various model services provided by the OpenRouter platform'
  },
  toolDescription:
    'This is an OpenRouter multi-modal tool set, supporting various model services provided by the OpenRouter platform',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      inputType: 'secret'
    }
  ]
});
