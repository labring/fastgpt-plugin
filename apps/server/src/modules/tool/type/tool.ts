import { z } from 'zod';
import {
  InputConfigSchema,
  ToolTagEnum,
  VersionListItemSchema,
  ToolConfigSchema
} from '@/validates/tool';
import { ToolCallbackType } from './req';

// Re-export from validates
export { VersionListItemSchema, ToolConfigSchema };

// ==================== Module-specific Schemas (with callback) ====================

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
