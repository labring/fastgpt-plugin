import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import scrape from './children/scrape';

export default defineToolSet({
  name: {
    'zh-CN': 'Firecrawl',
    en: 'Firecrawl'
  },
  icon: '',
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '使用从任何网站抓取的干净数据为您的AI应用程序提供动力。',
    en: `Web scraper for LLMs. Power your AI apps with clean data crawled from any website. It's also open source. `
  },
  children: [scrape]
});
