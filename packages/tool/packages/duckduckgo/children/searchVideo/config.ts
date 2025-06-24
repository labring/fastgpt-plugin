import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  toolId: 'community-duckduckgo/searchVideo',
  name: {
    'zh-CN': 'DuckDuckGo 视频检索',
    en: 'DockDuckGo Video Search'
  },
  description: {
    'zh-CN': '使用 DuckDuckGo 进行视频检索',
    en: 'Use DuckDuckGo to search videos'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
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
