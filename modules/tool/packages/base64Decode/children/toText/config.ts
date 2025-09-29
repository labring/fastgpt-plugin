import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Base64 转文本',
    en: 'Base64 to text'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '将 Base64 编码的字符串转换为文本。',
    en: 'Enter a Base64-encoded string and get a text.'
  },
  toolDescription: 'Base64-encoded to text',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'base64',
          label: 'Base64 字符串',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'text',
          label: '文本',
          required: true
        }
      ]
    }
  ]
});
