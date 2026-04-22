import {
  DatasetSourceConfigSchema as BaseDatasetSourceConfigSchema,
  DatasetSourceIdEnum as BaseDatasetSourceIdEnum,
  DatasetSourceInfoSchema as BaseDatasetSourceInfoSchema,
  FileContentResponseSchema as BaseFileContentResponseSchema,
  FileItemSchema as BaseFileItemSchema
} from '@fastgpt-plugin/helpers/datasets/schemas';
import { z } from '@hono/zod-openapi';

// Convert base schemas to OpenAPI schemas
export const DatasetSourceIdEnum = z
  .enum(BaseDatasetSourceIdEnum.options)
  .openapi('DatasetSourceId');

export const DatasetSourceInfoSchema = z
  .object(BaseDatasetSourceInfoSchema.shape)
  .openapi('DatasetSourceInfo');

export const DatasetSourceConfigSchema = z
  .object(BaseDatasetSourceConfigSchema.shape)
  .openapi('DatasetSourceConfig');

export const FileItemSchema = z.object(BaseFileItemSchema.shape).openapi('FileItem');

export const FileContentResponseSchema = z
  .object(BaseFileContentResponseSchema.shape)
  .openapi('FileContentResponse');

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

// Re-export types from helpers
export type {
  DatasetSourceConfig,
  DatasetSourceId,
  DatasetSourceInfo,
  FileContentResponse,
  FileItem,
  FormFieldConfig,
  FormFieldType
} from '@fastgpt-plugin/helpers/datasets/schemas';
