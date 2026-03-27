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

export const EtagQuerySchema = z.object({
  etag: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'etag', in: 'query' },
      example: 'abc123def456'
    })
});

export const DeleteToolQuerySchema = z.object({
  toolId: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'toolId', in: 'query' },
      example: 'FastGPT@getTime',
      description: 'Tool ID in format author@toolId'
    }),
  version: z
    .string()
    .optional()
    .openapi({
      param: { name: 'version', in: 'query' },
      example: '1.0.0',
      description:
        'Optional version. If provided, deletes only this version. If omitted, deletes the entire tool.'
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

// export const RunStreamBodySchema = z.object({
//   toolId: z.string().openapi({ example: 'FastGPT@getTime' }),
//   version: z
//     .string()
//     .optional()
//     .openapi({ example: '1.0.0', description: 'Optional version. If omitted, uses latest.' }),
//   inputs: z.record(z.string(), z.any()).openapi({ example: { text: 'hello' } }),
//   systemVar: SystemVarSchema,
//   secrets: z
//     .record(z.string(), z.string())
//     .optional()
//     .openapi({ description: 'Secret values (not stored)' })
// });
