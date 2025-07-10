import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import { defineInputConfig } from '@tool/utils/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  inputConfig: defineInputConfig([
    {
      key: 'token',
      label: 'GitHub Token',
      description: '可选，填写后可提升API速率或访问更多信息',
      inputType: 'secret',
      required: false
    }
  ])
});
