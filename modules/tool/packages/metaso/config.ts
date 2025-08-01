import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': '秘塔搜索工具集',
    en: 'Metaso Tool Set'
  },
  courseUrl: 'https://metaso.cn/',
  type: ToolTypeEnum.search,
  description: {
    'zh-CN': '秘塔AI搜索工具集，包含智能搜索、问答和网页内容读取功能',
    en: 'Metaso AI search tool set, including intelligent search, Q&A and web content reading functionality'
  },
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'Metaso API密钥',
      description: 'Metaso API密钥，用于访问问答服务',
      required: true,
      inputType: 'secret'
    }
  ]
});
