import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': '墨迹天气',
    en: 'Moji Weather'
  },
  courseUrl: 'https://www.mojicb.com/apis',
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '墨迹天气工具集，提供天气查询相关功能',
    en: 'Moji Weather toolset providing weather query functionality'
  },
  toolDescription: 'Moji Weather toolset providing weather query functionality',
  icon: '/imgs/tools/mojiWeather.svg',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: '墨迹天气API密钥',
      description: '墨迹天气API密钥，用于访问天气服务',
      required: true,
      inputType: 'secret'
    }
  ]
});
