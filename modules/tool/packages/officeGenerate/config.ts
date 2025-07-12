import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import tool from './children/markdown2Word';

export default defineToolSet({
  name: {
    'zh-CN': '办公文档生成工具集',
    en: 'Office Document Generation Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '提供办公文档（如Word、Excel、PPT等）的生成和处理功能',
    en: 'Provides generation and processing capabilities for office documents (Word, Excel, PPT, etc.)'
  },
  children: [tool]
});
