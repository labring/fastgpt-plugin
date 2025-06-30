import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import tool from './children/tool';

export default defineToolSet({
  name: {
    'zh-CN': '样例工具集',
    en: 'Template Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '这是一个样例工具集',
    en: 'This is a sample tool set'
  },
  children: [tool]
});
