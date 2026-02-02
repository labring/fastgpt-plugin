import { createRoute, z } from '@hono/zod-openapi';
import { createResponseSchema, ErrorResponseSchema } from '@/utils/http';
import {
  SourceIdQuerySchema,
  ListFilesBodySchema,
  FileOperationBodySchema,
  DatasetSourceInfoSchema,
  DatasetSourceConfigSchema,
  FileItemSchema,
  FileContentResponseSchema
} from './common';

// GET /source/list - List all dataset sources
export const listSourcesRoute = createRoute({
  method: 'get',
  path: '/source/list',
  tags: ['Dataset'],
  summary: 'List all dataset sources',
  description: 'Get a list of all available dataset sources',
  responses: {
    200: {
      description: 'List of dataset sources',
      content: {
        'application/json': {
          schema: createResponseSchema(z.array(DatasetSourceInfoSchema))
        }
      }
    }
  }
});

// GET /source/config - Get dataset source config
export const getSourceConfigRoute = createRoute({
  method: 'get',
  path: '/source/config',
  tags: ['Dataset'],
  summary: 'Get dataset source config',
  description: 'Get configuration and form fields for a specific dataset source',
  request: {
    query: SourceIdQuerySchema
  },
  responses: {
    200: {
      description: 'Dataset source configuration',
      content: {
        'application/json': {
          schema: createResponseSchema(DatasetSourceConfigSchema)
        }
      }
    },
    404: {
      description: 'Source not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /source/listFiles - List files from dataset source
export const listFilesRoute = createRoute({
  method: 'post',
  path: '/source/listFiles',
  tags: ['Dataset'],
  summary: 'List files from dataset source',
  description: 'List files and folders from a dataset source',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ListFilesBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'List of files and folders',
      content: {
        'application/json': {
          schema: createResponseSchema(z.array(FileItemSchema))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    404: {
      description: 'Source not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /source/getContent - Get file content
export const getContentRoute = createRoute({
  method: 'post',
  path: '/source/getContent',
  tags: ['Dataset'],
  summary: 'Get file content',
  description: 'Get content of a file from a dataset source',
  request: {
    body: {
      content: {
        'application/json': {
          schema: FileOperationBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'File content',
      content: {
        'application/json': {
          schema: createResponseSchema(FileContentResponseSchema)
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    404: {
      description: 'Source not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /source/getPreviewUrl - Get file preview URL
export const getPreviewUrlRoute = createRoute({
  method: 'post',
  path: '/source/getPreviewUrl',
  tags: ['Dataset'],
  summary: 'Get file preview URL',
  description: 'Get a preview URL for a file from a dataset source',
  request: {
    body: {
      content: {
        'application/json': {
          schema: FileOperationBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Preview URL',
      content: {
        'application/json': {
          schema: createResponseSchema(z.object({ url: z.string() }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    404: {
      description: 'Source not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

// POST /source/getDetail - Get file detail
export const getDetailRoute = createRoute({
  method: 'post',
  path: '/source/getDetail',
  tags: ['Dataset'],
  summary: 'Get file detail',
  description: 'Get detailed information about a file from a dataset source',
  request: {
    body: {
      content: {
        'application/json': {
          schema: FileOperationBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'File detail',
      content: {
        'application/json': {
          schema: createResponseSchema(FileItemSchema)
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    404: {
      description: 'Source not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});
