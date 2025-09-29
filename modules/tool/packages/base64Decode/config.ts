import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Base64 解析',
    en: 'Base64 Decode'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '输入 Base64 编码的字符串，输出文本、图片等。',
    en: 'Enter a Base64-encoded string and get a text, image, etc.'
  }
});
