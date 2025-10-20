import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'gpt-image 绘图',
    en: 'gpt-image Image Generation'
  },
  courseUrl: 'https://platform.openai.com/docs/pricing',
  type: ToolTypeEnum.multimodal,
  icon: 'common/openai',
  description: {
    'zh-CN': '这是一个gpt-image 绘图工具集',
    en: 'This is a gpt-image image generation tool set'
  },
  toolDescription: 'gpt-image image generation tool set',
  secretInputConfig: [
    {
      key: 'baseUrl',
      label: 'BaseUrl',
      inputType: 'input',
      description: '默认为：https://api.openai.com/v1',
      defaultValue: 'https://api.openai.com/v1'
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 https://api.gpt.ge/pricing 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
