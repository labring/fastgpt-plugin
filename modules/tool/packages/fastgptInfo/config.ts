import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'FastGPT 信息获取 ',
    en: 'FastGPT Information Retrieval'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '获取 FastGPT 中的信息',
    en: 'Retrieve information from FastGPT'
  }
});
