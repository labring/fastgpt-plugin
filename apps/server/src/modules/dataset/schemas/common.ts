import { z } from '@hono/zod-openapi';
import {
  DatasetSourceIdEnum,
  DatasetSourceInfoSchema,
  DatasetSourceConfigSchema,
  FileItemSchema,
  FileContentResponseSchema
} from '../type/source';

// Query schemas
export const SourceIdQuerySchema = z.object({
  sourceId: DatasetSourceIdEnum.openapi({
    param: { name: 'sourceId', in: 'query' },
    example: 'feishu'
  })
});

// Body schemas
export const ListFilesBodySchema = z.object({
  sourceId: DatasetSourceIdEnum,
  config: z.record(z.string(), z.any()),
  parentId: z.string().optional()
});

export const FileOperationBodySchema = z.object({
  sourceId: DatasetSourceIdEnum,
  config: z.record(z.string(), z.any()),
  fileId: z.string()
});

// Re-export type schemas for routes
export {
  DatasetSourceIdEnum,
  DatasetSourceInfoSchema,
  DatasetSourceConfigSchema,
  FileItemSchema,
  FileContentResponseSchema
};
