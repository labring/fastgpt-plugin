import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'allTick',
    en: 'allTick'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '这是一个 allTick 工具集，金融市场信息的获取工具',
    en: 'This is a set of allTick tools for fetching financial market information.'
  },
  courseUrl: 'https://alltick.co/zh-CN',
  toolDescription: 'This is a set of allTick tools for fetching financial market information.',
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
