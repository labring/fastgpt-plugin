import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
  name: {
    'zh-CN': 'DuckDuckGo 网络搜索',
    en: 'DuckDuckGo Network Search'
  },
  description: {
    'zh-CN': '使用 DuckDuckGo 进行网络搜索',
    en: 'Use DuckDuckGo to search the web'
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
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '检索结果'
        }
      ]
    }
  ]
});
