import { z } from 'zod';
import { InfoString } from '@/type/i18n';
import { InputSchema, OutputSchema } from './fastgpt';

/* Call back type */
export const SystemVarSchema = z.object({
  user: z.object({
    id: z.string(),
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

export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  inputs: z.array(InputSchema).describe('The inputs of the tool'),
  outputs: z.array(OutputSchema).describe('The outputs of the tool')
});

export const ToolConfigSchema = z
  .object({
    toolId: z.string().optional().describe('The unique id of the tool'),
    name: InfoString.describe('The name of the tool'),
    description: InfoString.describe('The description of the tool'),
    versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),

    // Can be inherited
    isActive: z.boolean().optional().describe('Default is active'),
    type: z.nativeEnum(ToolTypeEnum).optional().describe('The type of the tool'),
    icon: z.string().optional().describe('The icon of the tool'),
    author: z.string().optional().describe('The author of the tool'),
    courseUrl: z.string().optional().describe('The documentation URL of the tool')
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
    toolDirName: z.string()
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
