import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'allTick',
    en: 'allTick'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '这是一个allTick工具集',
    en: 'This is a allTick tool set'
  },
  courseUrl: 'https://alltick.co/zh-CN',
  toolDescription:
    'tool description for ai to use, fallback to English description if not provided',
  secretInputConfig: [
    {
      key: 'token',
      label: 'token',
      description: '可以在 https://alltick.co/zh-CN 注册获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
