import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'BI图表功能',
    en: 'BI Charts'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'BI图表功能，可以生成一些常用的图表，如饼图，柱状图，折线图等',
    en: 'BI Charts, can generate some common charts, such as pie charts, bar charts, line charts, etc.'
  },
  icon: 'core/workflow/template/BI'
});
