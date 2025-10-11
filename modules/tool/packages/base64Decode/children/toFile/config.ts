import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Base64 转文件',
    en: 'Base64 to File'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '将 Base64 编码的字符串转换为文件。',
    en: 'Enter a Base64-encoded string and get a file.'
  },
  toolDescription: 'Base64-encoded to file',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'base64',
          label: 'Base64 字符串',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: '文件 URL',
          description: '可访问的文件地址: http://example.com',
          required: true
        }
      ]
    }
  ]
});
