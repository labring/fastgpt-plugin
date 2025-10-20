import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
  name: {
    'zh-CN': 'gpt-image 图像编辑',
    en: 'gpt-image Image Editing'
  },
  description: {
    'zh-CN': '使用gpt-image-1模型对现有图像进行编辑和修改',
    en: 'Edit and modify existing images using gpt-image-1 model'
  },
  toolDescription:
    'Edit existing images using gpt-image-1 AI model. Supports image modification with optional mask for precise editing.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'image',
          label: '原始图片',
          toolDescription: 'The original image to be edited (URL or base64)',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '要编辑的原始图片，支持图片URL或base64编码，文件大小需小于4MB'
        },
        {
          key: 'prompt',
          label: '编辑描述',
          toolDescription: 'Describe what changes you want to make to the image',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '描述要对图片进行的修改'
        },
        {
          key: 'size',
          label: '图片尺寸',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: '1024x1024',
          list: [
            { label: '1024x1024', value: '1024x1024' },
            { label: '1024x1536', value: '1024x1536' },
            { label: '1536x1024', value: '1536x1024' }
          ]
        },
        {
          key: 'quality',
          label: '图片质量',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: 'medium',
          list: [
            { label: '标准质量', value: 'medium' },
            { label: '高质量', value: 'high' },
            { label: '低质量', value: 'low' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'imageUrl',
          label: '编辑后图片链接',
          description: '编辑后的图片文件链接'
        }
      ]
    }
  ]
});
