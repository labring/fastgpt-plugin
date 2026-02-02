import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'Tavily 搜索',
    en: 'Tavily Search'
  },
  tags: [ToolTagEnum.enum.search],
  description: {
    'zh-CN': '提供 Tavily AI 搜索和内容提取功能,支持智能搜索和网页内容抽取',
    en: 'Provides Tavily AI search and content extraction capabilities'
  },
  toolDescription: `A Tavily AI search toolset with SEARCH and EXTRACT operations.
    Use these tools to perform AI-powered web searches with advanced filtering
    and extract structured content from web pages.`,
  courseUrl: 'https://app.tavily.com',
  // 共享密钥配置 - 所有子工具共享
  secretInputConfig: [
    {
      key: 'tavilyApiKey',
      label: 'Tavily API Key',
      description:
        'Tavily API 密钥 (格式: tvly-xxxxxxxxxxxxxxxxxxxxxxxx), 在 https://app.tavily.com 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
