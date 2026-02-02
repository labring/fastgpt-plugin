import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': '数据库操作',
    en: 'Database Operations'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN':
      '数据库操作工具集，包含 MySQL、PostgreSQL、Microsoft SQL Server、Oracle、ClickHouse 数据库操作功能',
    en: 'Database Operations Tool Set, including MySQL, PostgreSQL, Microsoft SQL Server, Oracle, ClickHouse database operations functionality'
  }
});
