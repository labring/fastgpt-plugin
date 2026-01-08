import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '图像生成',
    en: 'Image Generate'
  },
  description: {
    'zh-CN': '使用 Stability AI 生成图像，支持 Ultra、Core 和 SD3.5 系列模型',
    en: 'Generate images using Stability AI, supporting Ultra, Core and SD3.5 series models'
  },
  toolDescription:
    'Generate images from text prompts using Stability AI models including Ultra for highest quality, Core for balanced performance, and SD3.5 series for advanced generation capabilities',
  versionList: [
    {
      value: '0.1.1',
      description: 'Initial version with multi-model support',
      inputs: [
        {
          key: 'prompt',
          label: '提示词',
          description: '描述想要生成的图像',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The text description of the image you want to generate',
          placeholder: '例如: A serene landscape with mountains and a lake at sunset'
        },
        {
          key: 'model',
          label: '模型选择',
          description: '选择图像生成模型',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'Ultra (高质量)', value: 'ultra' },
            { label: 'Core (平衡)', value: 'core' },
            { label: 'SD3.5 Large', value: 'sd3.5-large' },
            { label: 'SD3.5 Large Turbo', value: 'sd3.5-large-turbo' },
            { label: 'SD3.5 Medium', value: 'sd3.5-medium' }
          ],
          defaultValue: 'core'
        },
        {
          key: 'aspect_ratio',
          label: '宽高比',
          description: '图像的宽高比例',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '1:1 (正方形)', value: '1:1' },
            { label: '16:9 (宽屏)', value: '16:9' },
            { label: '21:9 (超宽)', value: '21:9' },
            { label: '2:3 (竖屏)', value: '2:3' },
            { label: '3:2 (横屏)', value: '3:2' },
            { label: '4:5 (竖屏)', value: '4:5' },
            { label: '5:4 (横屏)', value: '5:4' },
            { label: '9:16 (竖屏)', value: '9:16' },
            { label: '9:21 (超竖)', value: '9:21' }
          ],
          defaultValue: '1:1'
        },
        {
          key: 'negative_prompt',
          label: '负面提示词',
          description: '描述不希望在图像中出现的内容',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription:
            'Things you do not want to see in the generated image (optional negative prompt)',
          placeholder: '例如: blurry, low quality, distorted'
        },
        {
          key: 'style_preset',
          label: '风格预设',
          description: '图像风格预设（仅 Core 模型支持）',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '3D 模型', value: '3d-model' },
            { label: '模拟胶片', value: 'analog-film' },
            { label: '动漫', value: 'anime' },
            { label: '电影', value: 'cinematic' },
            { label: '漫画书', value: 'comic-book' },
            { label: '数字艺术', value: 'digital-art' },
            { label: '增强', value: 'enhance' },
            { label: '奇幻艺术', value: 'fantasy-art' },
            { label: '等距', value: 'isometric' },
            { label: '线条艺术', value: 'line-art' },
            { label: '低多边形', value: 'low-poly' },
            { label: '建模复合', value: 'modeling-compound' },
            { label: '霓虹朋克', value: 'neon-punk' },
            { label: '折纸', value: 'origami' },
            { label: '摄影', value: 'photographic' },
            { label: '像素艺术', value: 'pixel-art' },
            { label: '瓷砖纹理', value: 'tile-texture' }
          ],
          placeholder: '选择风格预设（可选）'
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于可重现的生成，范围 0-4294967294',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          min: 0,
          max: 4294967294,
          placeholder: '留空则随机生成'
        },
        {
          key: 'output_format',
          label: '输出格式',
          description: '生成图像的文件格式',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'PNG', value: 'png' },
            { label: 'JPEG', value: 'jpeg' },
            { label: 'WEBP', value: 'webp' }
          ],
          defaultValue: 'webp'
        }
      ],
      outputs: [
        {
          key: 'link',
          label: '图片链接',
          description: '生成的图片访问链接',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
