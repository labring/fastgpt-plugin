import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'Firecrawl',
    en: 'Firecrawl'
  },
  tags: [ToolTagEnum.enum.search],
  description: {
    'zh-CN': '使用从任何网站抓取的干净数据为您的AI应用程序提供动力。',
    en: `Web scraper for LLMs. Power your AI apps with clean data crawled from any website. It's also open source. `
  },
  secretInputConfig: [
    {
      key: 'apiUrl',
      label: 'Firecrawl API Url',
      description: 'Firecrawl 的 API 地址，如果使用官方的服务，这里可以留空。',
      required: false,
      inputType: 'input'
    },
    {
      key: 'apiKey',
      label: 'Firecrawl API Key',
      required: true,
      inputType: 'secret'
    }
  ]
});
