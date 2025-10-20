import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
  name: {
    'zh-CN': 'gpt-image 图像生成',
    en: 'gpt-image Image Generation'
  },
  description: {
    'zh-CN': '使用gpt-image-1模型根据文本描述生成高质量图像',
    en: 'Generate high-quality images from text descriptions using gpt-image-1 model'
  },
  toolDescription:
    'Generate images from text prompts using gpt-image-1 AI model. Supports various sizes and quality settings.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'prompt',
          label: '图像描述',
          toolDescription: 'Describe the image you want to generate in detail',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '详细描述要生成的图像内容'
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
        },
        {
          key: 'background',
          label: '背景透明度',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: 'auto',
          list: [
            { label: '自动', value: 'auto' },
            { label: '透明', value: 'transparent' },
            { label: '不透明', value: 'opaque' }
          ]
        },
        {
          key: 'moderation',
          label: '图片审查级别',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          defaultValue: 'auto',
          list: [
            { label: '自动', value: 'auto' },
            { label: '低', value: 'low' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'imageUrl',
          label: '图片链接',
          description: '生成的图片文件链接'
        }
      ]
    }
  ]
});
