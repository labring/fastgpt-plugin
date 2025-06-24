import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  toolId: 'searchVideo',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version'
    }
  ],
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'DuckDuckGo 视频检索',
    en: 'DockDuckGo Video Search'
  },
  description: {
    'zh-CN': '使用 DuckDuckGo 进行视频检索',
    en: 'Use DuckDuckGo to search videos'
  },
  icon: 'core/workflow/template/duckduckgo',
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
});
