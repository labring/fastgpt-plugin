import { defineToolSet, ToolTagEnum } from '@fastgpt-plugin/helpers';

export default defineToolSet({
  name: {
    'zh-CN': '{{name}}',
    en: '{{name}}'
  },
  tags: [ToolTagEnum.tools],
  description: {
    'zh-CN': '{{description}}',
    en: '{{description}}'
  },
  secretInputConfig: []
});
