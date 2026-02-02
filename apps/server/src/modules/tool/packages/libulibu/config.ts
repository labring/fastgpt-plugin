import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'libulibu 工具集',
    en: 'Libulibu Tool Set'
  },
  tags: [ToolTagEnum.enum.multimodal],
  description: {
    'zh-CN': 'libulibu 工具集',
    en: 'Libulibu Tool Set'
  },
  courseUrl: 'https://www.liblib.art/apis',
  secretInputConfig: [
    {
      key: 'accessKey',
      label: 'accessKey',
      description: '可以在 https://www.liblib.art/apis 获取',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'secretKey',
      label: 'secretKey',
      description: '可以在 https://www.liblib.art/apis 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
