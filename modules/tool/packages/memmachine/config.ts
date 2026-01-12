import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'MemMachine',
    en: 'MemMachine'
  },
  tags: [ToolTagEnum.enum.tools],
  courseUrl: 'https://docs.memmachine.ai/getting_started/introduction',
  description: {
    'zh-CN': '这是 MemMachine 工具集，支持通过 MemMachine API 进行记忆的存储与搜索。',
    en: 'This is the MemMachine tool set, which supports memory storage and search via the MemMachine API.'
  },
  toolDescription: 'Enables efficient memory storage and search via the MemMachine API.',
  secretInputConfig: [
    {
      key: 'baseUrl',
      label: 'Base URL（Saas服务不需要填写）',
      description: '例如：https://api.memmachine.ai/v2，http://127.0.0.1:8080/api/v2',
      inputType: 'input'
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 https://console.memmachine.ai 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
