import z from 'zod';

import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '../../src/index';

const handler = createToolHandler({
  inputSchema: z.object({
    msg: z.string().meta({
      title: 'Message',
      isToolParams: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    reply: z.string().meta({
      title: 'Reply'
    } satisfies OutputSchemaMetaType)
  }),
  secretSchema: z.object({
    apikey: z.string().meta({
      title: 'API Key',
      isSecret: true
    } satisfies SecretSchemaMetaType)
  }),
  handler: async (input, ctx) => {
    const msg = 'Hello!' + input.msg + ctx.secrets;
    ctx.streamResponse({
      content: msg + 'tool stream response',
      type: 'answer'
    });
    return {
      reply: msg
    };
  }
});

const tool = defineTool({
  handler,
  manifest: {
    pluginId: 'test',
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    },
    description: {
      en: 'test tool',
      'zh-CN': '测试工具'
    },
    name: {
      en: 'Test Tool',
      'zh-CN': '测试工具'
    },
    author: 'Test Author',
    permission: ['userInfo:read'],
    repoUrl: 'https://git.example.com/some/repo',
    tutorialUrl: 'https://docs.example.com/some/tutorial',
    tags: ['tools']
    // toolDescription: 'This is a test tool for demonstration purposes.',
    // icon: 'icon',
  }
});

console.log(tool.getSecretSchema().toJSONSchema());
console.log(tool.getToolHandler());
