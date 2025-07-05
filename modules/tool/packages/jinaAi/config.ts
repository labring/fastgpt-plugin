import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import jinaAiSearch from './children/jinaAiSearch';
import jinaAiReader from './children/jinaAiReader';

export default defineToolSet({
  name: {
    'zh-CN': 'Jina AI 工具集',
    en: 'Jina AI Tool Set'
  },
  courseUrl: 'https://jina.ai/',
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'Jina AI 提供的智能搜索和网页内容提取工具集，包含搜索引擎和网页阅读器功能',
    en: 'Jina AI intelligent search and web content extraction tool set, including search engine and web reader functionality'
  },
  children: [jinaAiSearch, jinaAiReader]
});
