import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'ArXiv 工具集',
    en: 'ArXiv Tools'
  },
  tags: [ToolTagEnum.enum.scientific],
  description: {
    'zh-CN': '提供 ArXiv 论文检索相关功能，包括关键词搜索、排序等',
    en: 'Provides ArXiv paper search functionalities, including keyword search, sorting, etc.'
  }
});
