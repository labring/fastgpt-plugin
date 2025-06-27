import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  toolId: 'community-duckduckgo/searchImg',
  name: {
    'zh-CN': 'DuckDuckGo 图片搜索',
    en: 'DockDuckGo Image Search'
  },
  description: {
    'zh-CN': '使用 DuckDuckGo 进行图片搜索',
    en: 'Use DuckDuckGo to search images'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
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
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: 'result',
          description: ' 检索结果'
        }
      ]
    }
  ]
});
