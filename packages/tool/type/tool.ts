import { z } from 'zod';
import { InfoString } from './common';
import { SystemVarSchema } from '.';

export const ToolCallbackReturnSchema = z.object({
  error: z.any().optional(),
  output: z.record(z.any()).optional()
});
export const ToolCallbackType = z
  .function()
  .args(z.any(), SystemVarSchema)
  .returns(z.promise(ToolCallbackReturnSchema));

export const VersionListItemSchema = z.object({
  version: z.string(),
  description: z.string().optional()
});

export const ToolTypeEnum = z.enum(['tools', 'search', 'multimodal', 'communication', 'other']);

export const ToolConfigSchema = z
  .object({
    toolId: z.string().describe('The unique id of the tool').optional(),
    name: InfoString.describe('The name of the tool'),
    description: InfoString.describe('The description of the tool'),
    type: ToolTypeEnum.describe('The type of the tool'),
    icon: z.string().describe('The icon of the tool'),
    author: z.string().optional().describe('The author of the tool'),
    docURL: z.string().optional().describe('The documentation URL of the tool'),
    isActive: z.boolean().optional().describe('Whether it is active'),
    versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
    inputs: z.array(z.any()).describe('The inputs of the tool'),
    outputs: z.array(z.any()).describe('The outputs of the tool')
  })
  .describe('The Tool Config Schema');

export const ToolSchema = ToolConfigSchema.omit({
  toolId: true
}).merge(
  z.object({
    toolId: z.string().describe('The unique id of the tool'),
    cb: ToolCallbackType.describe('The callback function of the tool'),
    isToolSet: z.boolean().describe('Whether it is a tool set'),
    parentId: z.string().optional().describe('The parent id of the tool'),
    toolFile: z.string()
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
    isToolSet: z.boolean().describe('Whether it is a tool set'),
    children: z.array(ToolSchema).describe('The children of the tool set')
  })
).describe('The ToolSet Schema');

export const ToolListItemSchema = z.object({
  id: z.string().describe('The unique id of the tool'),
  isFolder: z.boolean().describe('Whether it is a folder'),
  parentId: z.string().optional().describe('The parent id of the tool'),
  docUrl: z.string().optional().describe('The documentation URL of the tool'),
  name: InfoString.describe('The name of the tool'),
  avatar: z.string().describe('The icon of the tool'),
  versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
  workflow: z.object({
    nodes: z.array(z.any()).describe('The workflow nodes'),
    edges: z.array(z.any()).describe('The workflow edges')
  }),
  intro: InfoString.describe('The introduction of the tool'),
  templateType: ToolTypeEnum.describe('The type of the tool'),
  pluginOrder: z.number().describe('The order of the plugin'),
  isActive: z.boolean().describe('Whether it is active'),
  weight: z.number().describe('The weight of the tool'),
  originCost: z.number().describe('The origin cost of the tool'),
  currentCost: z.number().describe('The current cost of the tool'),
  hasTokenFee: z.boolean().describe('Whether it has token fee'),
  inputs: z.array(z.any()).describe('The inputs of the tool'),
  outputs: z.array(z.any()).describe('The outputs of the tool')
});

type ToolListItemType = z.infer<typeof ToolListItemSchema>;

export function formatToolList(list: z.infer<typeof ToolSchema>[]): ToolListItemType[] {
  return list.map((item, index) => ({
    id: item.toolId,
    isFolder: item.isToolSet,
    parentId: item.parentId,
    docUrl: item.docURL,
    name: item.name,
    avatar: item.icon,
    versionList: item.versionList,
    workflow: {
      nodes: [],
      edges: []
    },
    intro: item.description,
    templateType: item.type,
    pluginOrder: index,
    isActive: item.isActive ?? true,
    weight: index,
    originCost: 0,
    currentCost: 0,
    hasTokenFee: false,
    inputs: item.inputs,
    outputs: item.outputs
  }));
}
