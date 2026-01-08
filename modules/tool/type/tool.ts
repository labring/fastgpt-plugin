import { z } from 'zod';
import { I18nStringSchema } from '@/type/i18n';
import { InputConfigSchema, InputSchema, OutputSchema } from './fastgpt';
import { ToolTagEnum } from './tags';
import { ToolCallbackType } from './req';

export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  inputs: z.array(InputSchema).describe('The inputs of the tool'),
  outputs: z.array(OutputSchema).describe('The outputs of the tool')
});

export const ToolConfigSchema = z
  .object({
    isWorkerRun: z
      .boolean()
      .default(false)
      .optional()
      .describe('Whether to run the tool in a worker'),
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
    tags: z.array(ToolTagEnum).optional().describe('The tags of the tool'),
    icon: z.string().optional().describe('The icon of the tool'),
    author: z.string().optional().describe('The author of the tool'),
    courseUrl: z.string().optional().describe('The documentation URL of the tool'),
    secretInputConfig: z
      .array(InputConfigSchema)
      .optional()
      .describe('The secret input list of the tool')
  })
  .describe('The Tool Config Schema');

export const ToolConfigWithCbSchema = ToolConfigSchema.extend({
  cb: ToolCallbackType.describe('The callback function of the tool')
});

export const ToolSchema = ToolConfigWithCbSchema.extend({
  // Required
  toolId: z.string().describe('The unique id of the tool'),
  tags: z.array(ToolTagEnum).optional().describe('The tags of the tool'),
  icon: z.string().describe('The icon of the tool'),

  // Computed
  parentId: z.string().optional().describe('The parent id of the tool'),
  toolFilename: z.string(),

  version: z.string().describe('The version hash of the tool'),
  // ToolSet Parent
  secretInputConfig: z
    .array(InputConfigSchema)
    .optional()
    .describe('The secret input list of the tool')
});

export const ToolSetConfigSchema = ToolConfigSchema.omit({
  versionList: true
})
  .extend({
    tags: z.array(ToolTagEnum).describe('The tags of the tool'),
    children: z.array(ToolConfigWithCbSchema).optional().describe('The children of the tool set')
  })
  .describe('The ToolSet Config Schema');

export const ToolSetSchema = ToolSchema.omit({
  cb: true,
  parentId: true
})
  .extend({
    children: z.array(ToolSchema).describe('The children of the tool set')
  })
  .describe('The ToolSet Schema');
