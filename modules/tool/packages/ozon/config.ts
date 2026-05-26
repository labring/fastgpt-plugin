import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'Ozon Seller 商品管理',
    en: 'Ozon Seller Product Management'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '这是一个 Ozon Seller 商品管理工具集',
    en: 'This is a tool set for Ozon Seller product management'
  },
  toolDescription:
    '`Ozon Seller product management toolset: supports product creation, product querying (list/details), and upload task status polling; suitable for batch import and automated validation.`',
  secretInputConfig: [
    {
      key: 'clientId',
      label: 'client Id',
      description: '可以在 https://www.ozon.ru/my/main 获取',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在 https://www.ozon.ru/my/main 获取',
      required: true,
      inputType: 'secret'
    }
  ]
});
