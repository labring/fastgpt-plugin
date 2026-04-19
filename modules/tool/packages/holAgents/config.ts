import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': 'HOL Agents 工具集',
    en: 'HOL Agents Tools'
  },
  tags: [ToolTagEnum.enum.search, ToolTagEnum.enum.productivity],
  description: {
    'zh-CN': '发现和交互 Hashgraph Online 注册表上的 187K+ AI 代理。支持搜索代理、获取代理详情、查找相似代理。',
    en: 'Discover and interact with 187K+ AI agents on the Hashgraph Online registry. Search agents, get agent details, and find similar agents.'
  }
});
