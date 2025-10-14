import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Stability AI 图像生成',
    en: 'Stability AI Image Generation'
  },
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': 'Stability AI 提供的图像生成工具集，包含 Ultra、Core 和 SD3.5 模型',
    en: 'Stability AI image generation tool set including Ultra, Core and SD3.5 models'
  },
  toolDescription:
    'Stability AI image generation tools: Ultra for high-quality images, Core for balanced performance, and SD3.5 for advanced generation with model selection',
  secretInputConfig: [
    {
      key: 'STABILITY_KEY',
      label: 'Stability API Key',
      description: '可以在 https://platform.stability.ai 获取 API Key',
      required: true,
      inputType: 'secret'
    }
  ]
});
