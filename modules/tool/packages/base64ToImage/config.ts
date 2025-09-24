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
    'zh-CN': '将 Base64 编码的图片转换为图片',
    en: 'Convert Base64 encoded image to image'
  },
  toolDescription: 'Convert Base64 string to an image and return the file URL',
  icon: '/imgs/tools/base64ToImage.svg',
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
          description: '可访问的图片地址'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'type',
          label: 'MIME 类型',
          description: '文件内容类型'
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'size',
          label: '文件大小',
          description: '字节数'
        }
      ]
    }
  ]
});
