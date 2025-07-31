import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
export default defineToolSet({
  name: {
    'zh-CN': '硅基流动',
    en: 'Silicon Flow'
  },
  courseUrl: 'https://cloud.siliconflow.cn/i/TR9Ym0c4',
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': '这是一个硅基流动工具集',
    en: 'This is a Silicon Flow tool set'
  },
  secretInputConfig: [
    {
      key: 'authorization',
      label: '接口凭证（不需要 Bearer）',
      description: 'sk-xxxx',
      required: true,
      inputType: 'secret'
    }
  ]
});
