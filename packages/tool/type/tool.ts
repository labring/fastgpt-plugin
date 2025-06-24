import { z } from 'zod';
import { InfoString } from '@/type/i18n';
import { SystemVarSchema } from '.';
import { InputSchema, OutputSchema } from './fastgpt';

export const ToolCallbackReturnSchema = z.object({
  error: z.any().optional(),
  output: z.record(z.any()).optional()
});
export const ToolCallbackType = z
  .function()
  .args(z.any(), SystemVarSchema)
  .returns(z.promise(ToolCallbackReturnSchema));

const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional()
});

export enum ToolTypeEnum {
  tools = 'tools',
  search = 'search',
  multimodal = 'multimodal',
  communication = 'communication',
  other = 'other'
}

export const ToolConfigSchema = z
  .object({
    toolId: z.string().describe('The unique id of the tool').optional(),
    name: InfoString.describe('The name of the tool'),
    description: InfoString.describe('The description of the tool'),
    type: z.nativeEnum(ToolTypeEnum).describe('The type of the tool'),
    icon: z.string().optional().describe('The icon of the tool'),
    author: z.string().optional().describe('The author of the tool'),
    courseUrl: z.string().optional().describe('The documentation URL of the tool'),
    isActive: z.boolean().optional().describe('Whether it is active'),
    versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
    inputs: z.array(InputSchema).describe('The inputs of the tool'),
    outputs: z.array(OutputSchema).describe('The outputs of the tool')
  })
  .describe('The Tool Config Schema');

export const ToolSchema = ToolConfigSchema.omit({
  toolId: true,
  icon: true
}).merge(
  z.object({
    toolId: z.string().describe('The unique id of the tool'),
    icon: z.string().describe('The icon of the tool'),
    cb: ToolCallbackType.describe('The callback function of the tool'),
    parentId: z.string().optional().describe('The parent id of the tool'),
    toolFile: z.string().optional()
  })
);

export const ToolSetConfigSchema = ToolConfigSchema.omit({
  inputs: true,
  outputs: true
})
  .merge(
    z.object({
      children: z.array(ToolSchema).describe('The children of the tool set')
    })
  )
  .describe('The ToolSet Config Schema');

export const ToolSetSchema = ToolSetConfigSchema.merge(
  z.object({
    children: z.array(ToolSchema).describe('The children of the tool set')
  })
).describe('The ToolSet Schema');

export const ToolListItemSchema = z.object({
  id: z.string().describe('The unique id of the tool'),
  parentId: z.string().optional().describe('The parent id of the tool'),
  author: z.string().optional().describe('The author of the tool'),
  courseUrl: z.string().optional().describe('The documentation URL of the tool'),
  name: InfoString.describe('The name of the tool'),
  avatar: z.string().describe('The icon of the tool'),
  versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
  intro: InfoString.describe('The introduction of the tool'),
  templateType: z.nativeEnum(ToolTypeEnum).describe('The type of the tool'),
  pluginOrder: z.number().describe('The order of the plugin'),
  isActive: z.boolean().describe('Whether it is active'),
  weight: z.number().describe('The weight of the tool'),
  originCost: z.number().describe('The origin cost of the tool'),
  currentCost: z.number().describe('The current cost of the tool'),
  hasTokenFee: z.boolean().describe('Whether it has token fee'),
  inputs: z.array(InputSchema).describe('The inputs of the tool'),
  outputs: z.array(OutputSchema).describe('The outputs of the tool')
});
export type ToolListItemType = z.infer<typeof ToolListItemSchema>;
