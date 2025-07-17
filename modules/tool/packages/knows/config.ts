import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import search from './children/search';
import analysis from './children/analysis';
import summary from './children/summary';
import details from './children/details';
import history from './children/history';
import management from './children/management';

/**
 * KnowS 医学知识检索工具集配置
 * 采用 children 架构组织多个子工具，提供完整的医学知识服务
 */
export default defineToolSet({
  name: {
    'zh-CN': 'KnowS 医学知识检索',
    en: 'KnowS Medical Knowledge Retrieval'
  },
  description: {
    'zh-CN': '专业的医学知识检索和分析工具集，提供文献检索、证据分析、场景总结等功能',
    en: 'Professional medical knowledge retrieval and analysis toolset, providing literature search, evidence analysis, scenario summary and other functions'
  },
  type: ToolTypeEnum.scientific,
  icon: 'core/app/toolCall',
  author: 'FastGPT',
  children: [search, analysis, summary, details, history, management]
});