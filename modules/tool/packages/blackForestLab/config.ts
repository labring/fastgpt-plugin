import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Black Forest Lab(Flux模型)',
    en: 'Black Forest Lab (Flux Model)'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '一个提供Flux绘图模型的工具集',
    en: 'A toolset that provides Flux drawing models'
  }
});
