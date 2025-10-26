import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'SearchApi',
    en: 'SearchApi'
  },
  courseUrl: 'https://www.searchapi.io/',
  tags: [ToolTagEnum.enum.search],
  description: {
    'zh-CN': 'SearchApi 服务',
    en: 'SearchApi Service'
  },
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'Search API Key',
      required: true,
      inputType: 'secret'
    }
  ]
});
