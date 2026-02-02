import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'FLUX.1 图像编辑',
    en: 'FLUX.1 Image Editing'
  },
  description: {
    'zh-CN': '使用 FLUX.1 Kontext [pro] 模型对图像进行编辑，支持基于文本提示的图像修改',
    en: 'Edit images using FLUX.1 Kontext [pro] model, supports text-based image modification'
  },
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'prompt',
          label: '编辑描述',
          description: '描述您想要对图像进行的编辑操作',
          toolDescription: '图像描述',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'input_image',
          label: '输入图像',
          description:
            '要编辑的图像，可以是 URL 或 base64 编码的图像数据，支持最大 20MB 或 20 百万像素',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'aspect_ratio',
          label: '宽高比',
          description: '图像的宽高比，支持从 3:7 到 7:3',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          defaultValue: '1:1',
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: '3:7 (极窄竖屏)', value: '3:7' },
            { label: '4:7 (窄竖屏)', value: '4:7' },
            { label: '1:2 (竖屏)', value: '1:2' },
            { label: '9:16 (竖屏)', value: '9:16' },
            { label: '2:3 (竖屏)', value: '2:3' },
            { label: '3:4 (竖屏)', value: '3:4' },
            { label: '1:1 (正方形)', value: '1:1' },
            { label: '4:3 (横屏)', value: '4:3' },
            { label: '3:2 (横屏)', value: '3:2' },
            { label: '16:9 (横屏)', value: '16:9' },
            { label: '2:1 (横屏)', value: '2:1' },
            { label: '7:4 (宽横屏)', value: '7:4' },
            { label: '7:3 (极宽横屏)', value: '7:3' }
          ]
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于可重复生成的种子值，留空则使用随机种子',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'prompt_upsampling',
          label: '提示词增强',
          description: '是否对提示词进行优化增强',
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false
        },
        {
          key: 'safety_tolerance',
          label: '安全等级',
          description: '内容审核的严格程度，0 最严格，2 最宽松',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: '2',
          list: [
            { label: '0 - 最严格', value: '0' },
            { label: '1 - 中等', value: '1' },
            { label: '2 - 宽松 (默认)', value: '2' }
          ]
        },
        {
          key: 'output_format',
          label: '输出格式',
          description: '生成图像的文件格式',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'jpeg',
          list: [
            { label: 'JPEG', value: 'jpeg' },
            { label: 'PNG', value: 'png' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'image_url',
          label: '图片URL',
          description: '编辑后的图片URL'
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
