import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Flux 绘图',
    en: 'Flux Drawing'
  },
  courseUrl: 'https://www.flux.ai',
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': 'Flux官方绘图模型工具集',
    en: 'Flux official drawing model toolset'
  }
});
