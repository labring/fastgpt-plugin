import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import search from './children/search';
import searchImg from './children/searchImg';
import searchNews from './children/searchNews';
import searchVideo from './children/searchVideo';

export default defineToolSet({
  toolId: 'community-duckduckgo',
  name: {
    'zh-CN': 'DuckDuckGo服务',
    en: 'DuckDuckGo Service'
  },
  type: ToolTypeEnum.search,
  description: {
    'zh-CN': 'DuckDuckGo 服务，包含网络搜索、图片搜索、新闻搜索等。',
    en: 'DuckDuckGo Service, including network search, image search, news search, etc.'
  },
  icon: 'core/workflow/template/duckduckgo',
  author: 'FastGPT',
  children: [search, searchImg, searchNews, searchVideo]
});
