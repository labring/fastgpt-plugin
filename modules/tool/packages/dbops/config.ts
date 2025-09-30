import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': '数据库操作',
    en: 'Database Operations'
  },
  type: ToolTypeEnum.tools,
  // icon: 'core/workflow/template/datasource',
  description: {
    'zh-CN':
      '数据库操作工具集，包含 MySQL、PostgreSQL、Microsoft SQL Server、Oracle、ClickHouse 数据库操作功能',
    en: 'Database Operations Tool Set, including MySQL, PostgreSQL, Microsoft SQL Server, Oracle, ClickHouse database operations functionality'
  }
});
