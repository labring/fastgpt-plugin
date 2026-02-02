import { createRoute, z } from '@hono/zod-openapi';
import { createResponseSchema, ErrorResponseSchema } from '@/utils/http';
import {
  ToolDetailSchema,
  ToolTagListSchema,
  ToolIdParamSchema,
  FilenameQuerySchema,
  ObjectNameQuerySchema,
  ToolIdQuerySchema,
  ConfirmUploadBodySchema,
  InstallToolBodySchema,
  RunStreamBodySchema
} from './common';

// GET / - List all tools
export const listToolsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tools'],
  summary: 'List all tools',
  description: 'Get a list of all available tools',
  responses: {
    200: {
      description: 'List of tools',
      content: {
        'application/json': {
          schema: createResponseSchema(z.array(ToolDetailSchema))
        }
      }
    }
  }
});

// GET /tags - Get tool tags
export const getTagsRoute = createRoute({
  method: 'get',
  path: '/tags',
  tags: ['Tools'],
  summary: 'Get tool tags',
  description: 'Get all available tool tags',
  responses: {
    200: {
      description: 'List of tags',
      content: {
        'application/json': {
          schema: createResponseSchema(ToolTagListSchema)
        }
      }
    }
  }
});

// GET /:toolId - Get a tool by ID
export const getToolRoute = createRoute({
  method: 'get',
  path: '/{toolId}',
  tags: ['Tools'],
  summary: 'Get a tool by ID',
  description: 'Get detailed information about a specific tool',
  request: {
    params: ToolIdParamSchema
  },
  responses: {
    200: {
      description: 'Tool details',
      content: {
        'application/json': {
          schema: createResponseSchema(ToolDetailSchema)
        }
      }
    },
    404: {
      description: 'Tool not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// GET /upload/presign-tool-put-url - Get presigned upload URL
export const getPresignedUploadUrlRoute = createRoute({
  method: 'get',
  path: '/upload/presign-tool-put-url',
  tags: ['Tools', 'Upload'],
  summary: 'Get presigned upload URL',
  description: 'Generate a presigned URL for uploading a tool package',
  request: {
    query: FilenameQuerySchema
  },
  responses: {
    200: {
      description: 'Presigned URL information',
      content: {
        'application/json': {
          schema: createResponseSchema(
            z.object({
              postURL: z.string(),
              formData: z.record(z.string(), z.string()),
              objectName: z.string()
            })
          )
        }
      }
    }
  }
});

// POST /upload/confirm - Confirm uploaded tools
export const confirmUploadRoute = createRoute({
  method: 'post',
  path: '/upload/confirm',
  tags: ['Tools', 'Upload'],
  summary: 'Confirm uploaded tools',
  description: 'Confirm and activate uploaded tool packages',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConfirmUploadBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Upload confirmed',
      content: {
        'application/json': {
          schema: createResponseSchema(
            z.object({
              message: z.string()
            })
          )
        }
      }
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// DELETE /upload/delete - Delete a tool
export const deleteToolRoute = createRoute({
  method: 'delete',
  path: '/upload/delete',
  tags: ['Tools', 'Upload'],
  summary: 'Delete a tool',
  description: 'Delete a tool from the system',
  request: {
    query: ToolIdQuerySchema
  },
  responses: {
    200: {
      description: 'Tool deleted',
      content: {
        'application/json': {
          schema: createResponseSchema(
            z.object({
              message: z.string()
            })
          )
        }
      }
    },
    404: {
      description: 'Tool not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /upload/install - Install tools from URLs
export const installToolRoute = createRoute({
  method: 'post',
  path: '/upload/install',
  tags: ['Tools', 'Upload'],
  summary: 'Install tools from URLs',
  description: 'Download and install tool packages from remote URLs',
  request: {
    body: {
      content: {
        'application/json': {
          schema: InstallToolBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Tools installed',
      content: {
        'application/json': {
          schema: createResponseSchema(
            z.object({
              message: z.string()
            })
          )
        }
      }
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// GET /upload/parse-uploaded-tool - Parse uploaded tool package
export const parseUploadedToolRoute = createRoute({
  method: 'get',
  path: '/upload/parse-uploaded-tool',
  tags: ['Tools', 'Upload'],
  summary: 'Parse uploaded tool',
  description: 'Parse and validate an uploaded tool package',
  request: {
    query: ObjectNameQuerySchema
  },
  responses: {
    200: {
      description: 'Parsed tool information',
      content: {
        'application/json': {
          schema: createResponseSchema(z.array(ToolDetailSchema))
        }
      }
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /run-stream - Run tool with streaming response
export const runStreamRoute = createRoute({
  method: 'post',
  path: '/run-stream',
  tags: ['Tools'],
  summary: 'Run tool with streaming',
  description: 'Execute a tool and receive streaming response',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RunStreamBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Streaming response',
      content: {
        'text/event-stream': {
          schema: z.string()
        }
      }
    },
    404: {
      description: 'Tool not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});
