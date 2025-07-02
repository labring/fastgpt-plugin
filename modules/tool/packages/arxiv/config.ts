import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import keywordSearch from './children/keywordSearch';
import authorSearch from './children/authorSearch';
import arxivIDSearch from './children/arxivIDSearch';
import abstractExtraction from './children/abstractExtraction';
import metadataExtraction from './children/metadataExtraction';

export default defineToolSet({
  name: {
    'zh-CN': 'ArXiv 工具集',
    en: 'ArXiv Tools'
  },
  type: ToolTypeEnum.scientific,
  description: {
    'zh-CN': '提供 ArXiv 论文检索相关功能，包括关键词搜索、排序等',
    en: 'Provides ArXiv paper search functionalities, including keyword search, sorting, etc.'
  },
  children: [keywordSearch, authorSearch, arxivIDSearch, abstractExtraction, metadataExtraction]
});
