import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import paint from './children/paint';
import wanAi from './children/wanAi';
export default defineToolSet({
  toolId: 'siliconFlow',
  name: {
    'zh-CN': '硅基流动',
    en: 'Silicon Flow'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '这是一个硅基流动工具集',
    en: 'This is a Silicon Flow tool set'
  },
  children: [paint, wanAi]
});
