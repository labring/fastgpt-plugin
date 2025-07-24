import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import metasoSearch from './children/metasoSearch';
import metasoAsk from './children/metasoAsk';
import metasoReader from './children/metasoReader';

export default defineToolSet({
  name: {
    'zh-CN': 'Metaso 工具集',
    en: 'Metaso Tool Set'
  },
  courseUrl: 'https://metaso.cn/',
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'Metaso 秘塔AI搜索工具集，包含智能搜索、问答和网页内容读取功能',
    en: 'Metaso AI search tool set, including intelligent search, Q&A and web content reading functionality'
  },
  children: [metasoSearch, metasoAsk, metasoReader]
});
