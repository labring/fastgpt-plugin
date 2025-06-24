import { defineTool } from '@tool/type';

export default defineTool({
  toolId: 'search',
  versionList: [
    {
      version: '0.1.0',
      description: 'Default version'
    }
  ],
  type: 'search',
  name: {
    'zh-CN': 'DuckDuckGo 网络搜索',
    en: 'DuckDuckGo Network Search'
  },
  description: {
    'zh-CN': '使用 DuckDuckGo 进行网络搜索',
    en: 'Use DuckDuckGo to search the web'
  },
  icon: 'core/workflow/template/duckduckgo',
  inputs: [
    {
      renderTypeList: ['input', 'reference'],
      selectedTypeIndex: 0,
      valueType: 'string',
      key: 'query',
      label: 'query',
      description: '检索词',
      required: true,
      toolDescription: '检索词'
    }
  ],
  outputs: [
    {
      id: 'result',
      valueType: 'string',
      key: 'result',
      label: '检索结果',
      type: 'static'
    }
  ]
});
