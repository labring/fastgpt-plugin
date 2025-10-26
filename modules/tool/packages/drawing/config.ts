import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'BI图表功能',
    en: 'BI Charts'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': 'BI图表功能，可以生成一些常用的图表，如饼图，柱状图，折线图等',
    en: 'BI Charts, can generate some common charts, such as pie charts, bar charts, line charts, etc.'
  },
  icon: 'core/workflow/template/BI'
});
