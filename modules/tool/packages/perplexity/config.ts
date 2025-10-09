import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Perplexity 工具集',
    en: 'Perplexity Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '这是一个 Perplexity 工具集',
    en: 'This is a Perplexity tool set'
  },
  courseUrl: 'https://docs.perplexity.ai/getting-started/overview',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 Perplexity 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
