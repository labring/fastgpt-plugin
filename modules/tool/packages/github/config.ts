import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  secretInputConfig: [
    {
      key: 'token',
      label: 'GitHub Token',
      description: '可选，填写后可提升API速率或访问更多信息',
      inputType: 'secret',
      required: false
    }
  ]
});
