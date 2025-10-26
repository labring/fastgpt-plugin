import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'Jina AI 工具集',
    en: 'Jina AI Tool Set'
  },
  courseUrl: 'https://jina.ai/',
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': 'Jina AI 提供的智能搜索和网页内容提取工具集，包含搜索引擎和网页阅读器功能',
    en: 'Jina AI intelligent search and web content extraction tool set, including search engine and web reader functionality'
  },
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'Jina AI API密钥',
      description: 'Jina AI API密钥，格式：jina_xxxxxxxxxxxxxxxx',
      required: true,
      inputType: 'secret'
    }
  ]
});
