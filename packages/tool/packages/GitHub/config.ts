import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import repositoryInfoQuery from './children/repositoryInfoQuery';
import userInfoQuery from './children/userInfoQuery';

export default defineToolSet({
  name: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'GitHub 工具集',
    en: 'GitHub Tool Set'
  },
  children: [repositoryInfoQuery, userInfoQuery]
});
