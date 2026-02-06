import { defineToolSet, ToolTagEnum } from '@fastgpt-plugin/helpers';

export default defineToolSet({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': '{{name}}',
    en: '{{name}}'
  },
  description: {
    'zh-CN': '{{description}}',
    en: '{{description}}'
  }
});
