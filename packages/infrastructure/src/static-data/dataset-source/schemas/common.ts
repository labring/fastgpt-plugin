import {
  DatasetSourceConfigSchema as BaseDatasetSourceConfigSchema,
  DatasetSourceIdEnum as BaseDatasetSourceIdEnum,
  DatasetSourceInfoSchema as BaseDatasetSourceInfoSchema,
  FileContentResponseSchema as BaseFileContentResponseSchema,
  FileItemSchema as BaseFileItemSchema
} from '@fastgpt-plugin/helpers/datasets/schemas';
import { z } from 'zod';

export const DatasetSourceIdEnum = z.enum(BaseDatasetSourceIdEnum.options);

export const DatasetSourceInfoSchema = z.object(BaseDatasetSourceInfoSchema.shape);

export const DatasetSourceConfigSchema = z.object(BaseDatasetSourceConfigSchema.shape);

export const FileItemSchema = z.object(BaseFileItemSchema.shape);

export const FileContentResponseSchema = z.object(BaseFileContentResponseSchema.shape);

// Query schemas
export const SourceIdQuerySchema = z.object({
  sourceId: DatasetSourceIdEnum
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
