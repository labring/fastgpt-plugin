import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'SQL 连接工具集',
    en: 'SQL Connection Tool Set'
  },
  type: ToolTypeEnum.tools,
  icon: 'core/workflow/template/datasource',
  description: {
    'zh-CN': 'SQL 连接工具集，包含 MySQL、PostgreSQL、Microsoft SQL Server 数据库连接功能',
    en: 'SQL Connection Tool Set, including MySQL, PostgreSQL, Microsoft SQL Server database connection functionality'
  }
});
