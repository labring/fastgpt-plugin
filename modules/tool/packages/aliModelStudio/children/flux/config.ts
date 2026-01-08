import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'FLUX文生图',
    en: 'FLUX Text-to-Image'
  },
  description: {
    'zh-CN':
      '使用阿里云百炼FLUX模型将文本描述转换为图像。支持flux-schnell、flux-dev、flux-merged等模型，提供高质量的图像生成能力。',
    en: 'Convert text descriptions to images using Alibaba Cloud FLUX models. Supports flux-schnell, flux-dev, flux-merged models with high-quality image generation capabilities.'
  },
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'prompt',
          label: '文本提示词',
          description: '文本内容，支持中英文，中文不超过500个字符，英文不超过500个单词',
          toolDescription: '文本提示词',
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'model',
          label: '模型名称',
          description: '选择要使用的FLUX模型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'flux-schnell',
          list: [
            {
              label: 'flux-schnell (快速模型)',
              value: 'flux-schnell'
            },
            {
              label: 'flux-dev (开发模型)',
              value: 'flux-dev'
            },
            {
              label: 'flux-merged (混合模型)',
              value: 'flux-merged'
            }
          ]
        },
        {
          key: 'size',
          label: '图像尺寸',
          description: '设置生成图像的分辨率',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: '1024*1024',
          list: [
            { label: '512×1024', value: '512*1024' },
            { label: '768×512', value: '768*512' },
            { label: '768×1024', value: '768*1024' },
            { label: '1024×576', value: '1024*576' },
            { label: '576×1024', value: '576*1024' },
            { label: '1024×1024 (默认)', value: '1024*1024' }
          ]
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '图片生成时候的种子值，如果不提供，则算法自动用一个随机生成的数字作为种子',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 0
        },
        {
          key: 'steps',
          label: '推理步数',
          description:
            '图片生成的推理步数，如果不提供，则默认为30。flux-schnell模型官方默认steps为4，flux-dev模型官方默认steps为50',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 1
        },
        {
          key: 'guidance',
          label: '指导度量值',
          description:
            '用于在图像生成过程中调整模型的创造性与文本指导的紧密度。较高的值会使得生成的图像更忠于文本提示，但可能减少多样性；较低的值则允许更多创造性，增加图像变化。默认值为3.5',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 0,
          step: 0.1
        },
        {
          key: 'offload',
          label: 'GPU卸载',
          description:
            '是否在采样过程中将部分计算密集型组件临时从GPU卸载到CPU，以减轻内存压力或提升效率。默认为False',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'add_sampling_metadata',
          label: '添加元数据',
          description: '是否在输出的图像文件中嵌入生成时使用的提示文本等元数据信息。默认为True',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'images',
          label: '生成的图片',
          description: '包含图片URL的数组'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ]
});
