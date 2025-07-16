import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'FLUX.1 图像生成',
    en: 'FLUX.1 Image Generation'
  },
  description: {
    'zh-CN': '使用 FLUX.1 Kontext [pro] 模型生成高质量图像，支持文本到图像的生成',
    en: 'Generate high-quality images using FLUX.1 Kontext [pro] model, supports text-to-image generation'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          inputList: [
            {
              key: 'apiKey',
              label: 'API Key',
              description: '可以在 https://api.bfl.ai/ 获取 API Key',
              required: true,
              inputType: 'secret'
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'prompt',
          label: '图像描述',
          description: '描述您想要生成的图像',
          toolDescription: '图像描述',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'aspect_ratio',
          label: '宽高比',
          description: '图像的宽高比，例如 "1:1", "16:9", "3:4" 等，支持从 3:7 到 7:3',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          defaultValue: '1:1',
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: '1:1 (正方形)', value: '1:1' },
            { label: '16:9 (横屏)', value: '16:9' },
            { label: '9:16 (竖屏)', value: '9:16' },
            { label: '3:4 (竖屏)', value: '3:4' },
            { label: '4:3 (横屏)', value: '4:3' },
            { label: '21:9 (超宽屏)', value: '21:9' },
            { label: '3:7 (极窄竖屏)', value: '3:7' },
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
          description: '内容审核的严格程度，0 最严格，6 最宽松',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: '2',
          list: [
            { label: '0 - 最严格', value: '0' },
            { label: '1 - 很严格', value: '1' },
            { label: '2 - 严格 (默认)', value: '2' },
            { label: '3 - 中等', value: '3' },
            { label: '4 - 宽松', value: '4' },
            { label: '5 - 很宽松', value: '5' },
            { label: '6 - 最宽松', value: '6' }
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
          description: '生成的图片URL'
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
