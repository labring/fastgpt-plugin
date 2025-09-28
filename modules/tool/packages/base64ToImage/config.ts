import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Base64 转图片',
    en: 'Base64 to Image'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '输入 Base64 编码的图片，输出图片可访问链接。',
    en: 'Enter a Base64-encoded image and get a directly accessible image link.'
  },
  toolDescription: 'Enter a Base64-encoded image and get a directly accessible image link.',
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
          description: '可访问的图片地址: http://example.com'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'type',
          label: 'MIME 类型',
          description: 'MIME 类型'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'size',
          label: '图片大小（B）',
          description: '图片大小（B）'
        }
      ]
    }
  ]
});
