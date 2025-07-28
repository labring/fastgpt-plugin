import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': '模版工具',
    en: 'Template tool'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '描述',
    en: 'description'
  },
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 xxx 获取',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'formatStr',
          label: '格式化字符串',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'time',
          label: '时间',
          description: '当前时间'
        }
      ]
    }
  ]
});
