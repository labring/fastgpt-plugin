import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'Nano Banana 文生图',
    en: 'Nano Banana Text-to-Image'
  },
  description: {
    'zh-CN': '使用Nano Banana模型将文本描述转换为图像。',
    en: 'Convert text descriptions to images using Nano Banana models.'
  },
  toolDescription: 'Convert text descriptions to images using Nano Banana models.',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'text',
          label: '提示词',
          description: '生成图片的提示词',
          toolDescription: '生成图片的提示词',
          placeholder: '描述图片内容, 如: 生成一个关于人工智能的图片',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'aspect_ratio',
          label: '宽高比',
          description: '图像的宽高比，例如 "1:1", "16:9", "3:4" 等，支持从 1:1 到 21:9',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          defaultValue: '1:1',
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          list: [
            { label: '1:1', value: '1:1' },
            { label: '2:3', value: '2:3' },
            { label: '3:2', value: '3:2' },
            { label: '3:4', value: '3:4' },
            { label: '4:3', value: '4:3' },
            { label: '4:5', value: '4:5' },
            { label: '5:4', value: '5:4' },
            { label: '9:16', value: '9:16' },
            { label: '16:9', value: '16:9' },
            { label: '21:9', value: '21:9' }
          ]
        },
        {
          key: 'model',
          label: '模型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          defaultValue: 'google/gemini-2.5-flash-image-preview',
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          list: [
            {
              label: 'google/gemini-2.5-flash-image-preview',
              value: 'google/gemini-2.5-flash-image-preview'
            }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'imageUrl',
          label: '图片链接'
        }
      ]
    }
  ]
});
