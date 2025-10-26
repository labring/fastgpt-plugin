import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'DuckDuckGo服务',
    en: 'DuckDuckGo Service'
  },
  tags: [ToolTagEnum.enum.search],
  description: {
    'zh-CN': 'DuckDuckGo 服务，包含网络搜索、图片搜索、新闻搜索等。',
    en: 'DuckDuckGo Service, including network search, image search, news search, etc.'
  },
  icon: 'core/workflow/template/duckduckgo'
});
