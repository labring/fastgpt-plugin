import { z } from '@hono/zod-openapi';
import {
  ToolTagEnum,
  ToolDetailSchema as BaseToolDetailSchema,
  ToolSimpleSchema as BaseToolSimpleSchema,
  type ToolDetailType,
  type ToolSimpleType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';

// Re-export from validates
export { ToolTagEnum, type ToolDetailType, type ToolSimpleType };

// ==================== Tool Detail Schema (for API response) ====================
// Use z.object().extend() to convert standard zod schema to zod-openapi schema

export const ToolDetailSchema = z.object(BaseToolDetailSchema.shape).openapi('ToolDetail');
export const ToolSimpleSchema = z.object(BaseToolSimpleSchema.shape).openapi('ToolSimple');

// ==================== Tag List Schema ====================

export const ToolTagListSchema = z.array(
  z.object({
    label: z.string(),
    value: ToolTagEnum
  })
);

// ==================== Path Parameters ====================

export const ToolIdParamSchema = z.object({
  toolId: z
    .string()
    .min(5)
    .openapi({
      param: { name: 'toolId', in: 'path' },
      example: 'doc2x'
    })
});

// ==================== Query Parameters ====================

export const FilenameQuerySchema = z.object({
  filename: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'filename', in: 'query' },
      example: 'my-tool.zip'
    })
});

export const ObjectNameQuerySchema = z.object({
  objectName: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'objectName', in: 'query' },
      example: 'tools/temp/my-tool.zip'
    })
});

export const ToolIdQuerySchema = z.object({
  toolId: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'toolId', in: 'query' },
      example: 'doc2x'
    })
});

// ==================== Request Bodies ====================

export const ConfirmUploadBodySchema = z.object({
  toolIds: z.array(z.string()).openapi({
    example: ['tool1', 'tool2']
  })
});

export const InstallToolBodySchema = z.object({
  urls: z.array(z.url()).openapi({
    example: ['https://example.com/tool.zip']
  })
});

export const RunStreamBodySchema = z.object({
  toolId: z.string().openapi({ example: 'doc2x' }),
  inputs: z.record(z.string(), z.any()).openapi({ example: { text: 'hello' } }),
  systemVar: z.any().optional()
});
