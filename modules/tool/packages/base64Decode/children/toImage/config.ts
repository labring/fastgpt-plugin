import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': 'Base64 转图片',
    en: 'Base64 to Image'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '将 Base64 编码的字符串转换为图片。',
    en: 'Enter a Base64-encoded string and get a image.'
  },
  toolDescription: 'Base64-encoded to image',
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
          key: 'url',
          label: '图片 URL',
          description: '可访问的图片地址: http://example.com',
          required: true
        }
      ]
    }
  ]
});
