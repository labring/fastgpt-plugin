import {
  createToolHandler,
  defineInputSchema,
  defineOutputSchema,
  defineSecretSchema,
  defineToolSet
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = defineSecretSchema({
  host: {
    type: z.string(),
    title: { en: 'Host', 'zh-CN': '主机' },
    isSecret: false
  },
  port: {
    type: z.number(),
    title: { en: 'Port', 'zh-CN': '端口' },
    isSecret: false
  },
  username: {
    type: z.string(),
    title: { en: 'Username', 'zh-CN': '用户名' },
    isSecret: false
  },
  password: {
    type: z.string(),
    title: { en: 'Password', 'zh-CN': '密码' },
    isSecret: true
  },
  database: {
    type: z.string(),
    title: { en: 'Database', 'zh-CN': '数据库' },
    isSecret: false
  }
});

const mysqlHandler = createToolHandler({
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'SQL Query', 'zh-CN': 'SQL 查询' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    results: {
      type: z.array(z.record(z.string(), z.unknown())),
      title: { en: 'Query Results', 'zh-CN': '查询结果' }
    }
  }),
  secretSchema,
  handler: async (input, ctx) => {
    return {
      results: [
        {
          query: input.query,
          host: ctx.secrets?.host,
          port: ctx.secrets?.port,
          username: ctx.secrets?.username,
          password: ctx.secrets?.password,
          database: ctx.secrets?.database,
          db: 'MySQL'
        }
      ]
    };
  }
});

const pgsqlHandler = createToolHandler({
  inputSchema: defineInputSchema({
    query: {
      type: z.string(),
      title: { en: 'SQL Query', 'zh-CN': 'SQL 查询' },
      isToolParam: true
    }
  }),
  outputSchema: defineOutputSchema({
    results: {
      type: z.array(z.record(z.string(), z.unknown())),
      title: { en: 'Query Results', 'zh-CN': '查询结果' }
    }
  }),
  secretSchema,
  handler: async (input, ctx) => {
    return {
      results: [
        {
          query: input.query,
          host: ctx.secrets?.host,
          port: ctx.secrets?.port,
          username: ctx.secrets?.username,
          password: ctx.secrets?.password,
          database: ctx.secrets?.database,
          db: 'PostgreSQL'
        }
      ]
    };
  }
});

export default defineToolSet({
  manifest: {
    pluginId: 'dbops',
    name: {
      en: 'DB Operations',
      'zh-CN': '数据库操作'
    },
    description: {
      en: 'A suite of tools for database operations, including MySQL, PostgreSQL, SQL Server, Oracle, and ClickHouse.',
      'zh-CN':
        '一套用于数据库操作的工具，包括 MySQL、PostgreSQL、SQL Server、Oracle 和 ClickHouse。'
    },
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version with basic database operation tools.',
      'zh-CN': '初始版本，包含基本的数据库操作工具。'
    },
    author: 'test author'
  },
  children: [
    {
      description: {
        en: 'MySQL database operation tool',
        'zh-CN': 'MySQL 数据库操作工具'
      },
      name: {
        en: 'MySQL Tool',
        'zh-CN': 'MySQL 工具'
      },
      id: 'mysql',
      handler: mysqlHandler
    },
    {
      description: {
        en: 'PostgreSQL database operation tool',
        'zh-CN': 'PostgreSQL 数据库操作工具'
      },
      name: {
        en: 'PostgreSQL Tool',
        'zh-CN': 'PostgreSQL 工具'
      },
      id: 'pgsql',
      handler: pgsqlHandler
    }
  ],
  secretSchema
});
