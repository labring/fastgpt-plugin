import {
  createToolHandler,
  defineToolSet,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  host: z.string().meta({
    title: 'Host',
    isSecret: false
  } satisfies SecretSchemaMetaType),
  port: z.number().meta({
    title: 'Port',
    isSecret: false
  } satisfies SecretSchemaMetaType),
  username: z.string().meta({
    title: 'Username',
    isSecret: false
  } satisfies SecretSchemaMetaType),
  password: z.string().meta({
    title: 'Password',
    isSecret: true
  } satisfies SecretSchemaMetaType),
  database: z.string().meta({
    title: 'Database',
    isSecret: false
  } satisfies SecretSchemaMetaType)
});

const mysqlHandler = createToolHandler({
  inputSchema: z.object({
    query: z.string().meta({
      title: 'SQL Query'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())).meta({
      title: 'Query Results'
    } satisfies OutputSchemaMetaType)
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
  inputSchema: z.object({
    query: z.string().meta({
      title: 'SQL Query'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())).meta({
      title: 'Query Results'
    } satisfies OutputSchemaMetaType)
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
