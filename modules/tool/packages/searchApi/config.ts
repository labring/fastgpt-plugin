import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'SearchApi',
    en: 'SearchApi'
  },
  courseUrl: 'https://www.searchapi.io/',
  type: ToolTypeEnum.search,
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
