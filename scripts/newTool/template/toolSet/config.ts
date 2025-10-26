import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': '样例工具集',
    en: 'Template Tool Set'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '这是一个样例工具集',
    en: 'This is a sample tool set'
  },
  toolDescription:
    'tool description for ai to use, fallback to English description if not provided',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 xxx 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
