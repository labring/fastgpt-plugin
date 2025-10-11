import { z } from 'zod';
import { I18nStringSchema } from '@/type/i18n';
import { InputConfigSchema, InputSchema, OutputSchema } from './fastgpt';

/* Call back type */
export const SystemVarSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    contact: z.string(),
    membername: z.string(),
    teamName: z.string(),
    teamId: z.string(),
    name: z.string()
  }),
  app: z.object({
    id: z.string(),
    name: z.string()
    // version: z.string()
  }),
  tool: z.object({
    id: z.string(),
    version: z.string()
  }),
  time: z.string()
});
export type SystemVarType = z.infer<typeof SystemVarSchema>;

export const ToolCallbackReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.any())]).optional(),
  output: z.record(z.any()).optional()
});
export type ToolCallbackReturnSchemaType = z.infer<typeof ToolCallbackReturnSchema>;

export enum StreamMessageTypeEnum {
  response = 'response',
  error = 'error',
  stream = 'stream'
}
export enum StreamDataAnswerTypeEnum {
  answer = 'answer',
  fastAnswer = 'fastAnswer'
}

export const StreamDataSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerTypeEnum),
  content: z.string()
});
export type StreamDataType = z.infer<typeof StreamDataSchema>;

export const StreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.response),
    data: ToolCallbackReturnSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.stream),
    data: StreamDataSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.error),
    data: z.string()
  })
]);
export type StreamMessageType = z.infer<typeof StreamMessageSchema>;

export const runToolSecondParams = z.object({
  systemVar: SystemVarSchema,
  streamResponse: z.function().args(StreamDataSchema).returns(z.void()) // sendMessage
});
export type RunToolSecondParamsType = z.infer<typeof runToolSecondParams>;

export const ToolCallbackType = z
  .function()
  .args(z.any(), runToolSecondParams)
  .returns(z.promise(ToolCallbackReturnSchema));

/* Tool config type */
export enum ToolTypeEnum {
  tools = 'tools',
  search = 'search',
  multimodal = 'multimodal',
  communication = 'communication',
  finance = 'finance',
  design = 'design',
  productivity = 'productivity',
  news = 'news',
  entertainment = 'entertainment',
  social = 'social',
  scientific = 'scientific',
  other = 'other'
}

export type ToolClassifyType = {
  [key in ToolTypeEnum]: {
    en: string;
    'zh-CN': string;
    'zh-Hant': string;
  };
};

/* Tool config is passed to FastGPT */
export const ToolTypeMap = {
  [ToolTypeEnum.tools]: {
    en: 'tools',
    'zh-CN': '工具',
    'zh-Hant': '工具'
  },
  [ToolTypeEnum.search]: {
    en: 'search',
    'zh-CN': '搜索',
    'zh-Hant': '搜尋'
  },
  [ToolTypeEnum.multimodal]: {
    en: 'multimodal',
    'zh-CN': '多模态',
    'zh-Hant': '多模態'
  },
  [ToolTypeEnum.communication]: {
    en: 'communication',
    'zh-CN': '通信',
    'zh-Hant': '通訊'
  },
  [ToolTypeEnum.finance]: {
    en: 'finance',
    'zh-CN': '金融',
    'zh-Hant': '金融'
  },
  [ToolTypeEnum.design]: {
    en: 'design',
    'zh-CN': '设计',
    'zh-Hant': '設計'
  },
  [ToolTypeEnum.productivity]: {
    en: 'productivity',
    'zh-CN': '生产力',
    'zh-Hant': '生產力'
  },
  [ToolTypeEnum.news]: {
    en: 'news',
    'zh-CN': '新闻',
    'zh-Hant': '新聞'
  },
  [ToolTypeEnum.entertainment]: {
    en: 'entertainment',
    'zh-CN': '娱乐',
    'zh-Hant': '娛樂'
  },
  [ToolTypeEnum.social]: {
    en: 'social',
    'zh-CN': '社交',
    'zh-Hant': '社群'
  },
  [ToolTypeEnum.scientific]: {
    en: 'scientific',
    'zh-CN': '科学',
    'zh-Hant': '科學'
  },
  [ToolTypeEnum.other]: {
    en: 'other',
    'zh-CN': '其他',
    'zh-Hant': '其他'
  }
} as const;

export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  inputs: z.array(InputSchema).describe('The inputs of the tool'),
  outputs: z.array(OutputSchema).describe('The outputs of the tool')
});

export const ToolConfigSchema = z
  .object({
    isWorkerRun: z.boolean().optional().describe('Whether to run the tool in a worker'),
    toolId: z.string().optional().describe('The unique id of the tool'),
    name: I18nStringSchema.describe('The name of the tool'),
    description: I18nStringSchema.describe('The description of the tool'),
    toolDescription: z
      .string()
      .optional()
      .describe(
        'The tool description for ai to use, fallback to English description if not provided'
      ),
    versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),

    // Can be inherited
    isActive: z.boolean().optional().describe('Default is active'),
    type: z.nativeEnum(ToolTypeEnum).optional().describe('The type of the tool'),
    icon: z.string().optional().describe('The icon of the tool'),
    author: z.string().optional().describe('The author of the tool'),
    courseUrl: z.string().optional().describe('The documentation URL of the tool'),
    secretInputConfig: z
      .array(InputConfigSchema)
      .optional()
      .describe('The secret input list of the tool')
  })
  .describe('The Tool Config Schema');
export const toolConfigWithCbSchema = ToolConfigSchema.merge(
  z.object({
    cb: ToolCallbackType.describe('The callback function of the tool')
  })
);
export const ToolSchema = toolConfigWithCbSchema.merge(
  z.object({
    // Required
    toolId: z.string().describe('The unique id of the tool'),
    type: z.nativeEnum(ToolTypeEnum).describe('The type of the tool'),
    icon: z.string().describe('The icon of the tool'),

    // Computed
    parentId: z.string().optional().describe('The parent id of the tool'),
    toolDirName: z.string(),

    toolSource: z.enum(['built-in', 'uploaded']).optional().describe('The source of the tool'),
    // ToolSet Parent
    secretInputConfig: z
      .array(InputConfigSchema)
      .optional()
      .describe('The secret input list of the tool')
  })
);

export const ToolSetConfigSchema = ToolConfigSchema.omit({
  versionList: true
})
  .merge(
    z.object({
      type: z.nativeEnum(ToolTypeEnum).describe('The type of the tool'),
      children: z.array(toolConfigWithCbSchema).optional().describe('The children of the tool set')
    })
  )
  .describe('The ToolSet Config Schema');

export const ToolSetSchema = ToolSchema.omit({
  cb: true,
  parentId: true,
  toolDirName: true
})
  .merge(
    z.object({
      children: z.array(ToolSchema).describe('The children of the tool set')
    })
  )
  .describe('The ToolSet Schema');
