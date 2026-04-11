// import {
//   ToolDetailSchema,
//   ToolListItemSchema,
//   ToolRunBodySchema,
//   ToolTagListSchema
// } from '@fastgpt-plugin/helpers/dtos/tool.dto';
// import { createRoute, z } from '@hono/zod-openapi';

// import { createOpenAPIHono, createResponseSchema, ErrorResponseSchema } from './utils';

// export const toolRoute = createOpenAPIHono().basePath('/tool');
// toolRoute.openapi(listToolsRoute, async (c) => {});

// export const listToolsRoute = createRoute({
//   method: 'get',
//   path: '/',
//   tags: ['Tools'],
//   summary: 'List all tools',
//   description:
//     'Get a list of all available tools (one entry per author@toolId, latest version only)',
//   responses: {
//     200: {
//       description: 'List of tools',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(z.array(ToolListItemSchema.openapi({})))
//         }
//       }
//     },
//     400: {
//       description: 'Bad request',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // GET /tags - Get tool tags
// export const getTagsRoute = createRoute({
//   method: 'get',
//   path: '/tags',
//   tags: ['Tools'],
//   summary: 'Get tool tags',
//   description: 'Get all available tool tags',
//   responses: {
//     200: {
//       description: 'List of tags',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(ToolTagListSchema)
//         }
//       }
//     }
//   }
// });

// // GET /:toolId - Get a tool by ID
// export const getToolRoute = createRoute({
//   method: 'get',
//   path: '/{toolId}',
//   tags: ['Tools'],
//   summary: 'Get a tool by ID',
//   description:
//     'Get detailed information about a specific tool, including versionList with schemas and children for toolsets',
//   request: {
//     params: z.object({
//       toolId: z
//         .string()
//         .min(5)
//         .openapi({
//           param: { name: 'toolId', in: 'path' },
//           example: 'getTime'
//         })
//     })
//   },
//   responses: {
//     200: {
//       description: 'Tool details',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(ToolListItemSchema.openapi('ToolListItem'))
//         }
//       }
//     },
//     404: {
//       description: 'Tool not found',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // POST /upload/confirm - Confirm uploaded tools
// export const confirmUploadRoute = createRoute({
//   method: 'post',
//   path: '/upload/confirm',
//   tags: ['Tools', 'Upload'],
//   summary: 'Confirm uploaded tools',
//   description: 'Confirm and activate uploaded tool packages',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: ToolDetailSchema.openapi('ToolDetail')
//         }
//       }
//     }
//   },
//   responses: {
//     200: {
//       description: 'Upload confirmed',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(
//             z.object({
//               message: z.string()
//             })
//           )
//         }
//       }
//     },
//     400: {
//       description: 'Invalid parameters',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // DELETE /upload/delete - Delete a tool version or entire tool
// export const deleteToolRoute = createRoute({
//   method: 'delete',
//   path: '/upload/delete',
//   tags: ['Tools', 'Upload'],
//   summary: 'Delete a tool version or entire tool',
//   description:
//     'If version is provided, deletes only that version. If omitted, deletes the entire tool and all its versions.',
//   request: {
//     query: z.object({
//       pluginId: z.string().optional(),
//       version: z.string().optional()
//     })
//   },
//   responses: {
//     200: {
//       description: 'Tool deleted',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(
//             z.object({
//               message: z.string()
//             })
//           )
//         }
//       }
//     },
//     400: {
//       description: 'Invalid request',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     },
//     404: {
//       description: 'Tool not found',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // POST /upload/install - Install tools from URLs
// export const installToolRoute = createRoute({
//   method: 'post',
//   path: '/upload/install',
//   tags: ['Tools', 'Upload'],
//   summary: 'Install tools from URLs',
//   description: 'Download and install tool packages from remote URLs',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: z
//             .object({
//               urls: z.array(z.string()).openapi('ToolUrls')
//             })
//             .openapi('InstallToolBody')
//         }
//       }
//     }
//   },
//   responses: {
//     200: {
//       description: 'Tools installed',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(
//             z.object({
//               message: z.string()
//             })
//           )
//         }
//       }
//     },
//     400: {
//       description: 'Invalid parameters',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // POST /upload/parse-tool - Upload and parse tool package
// export const parseUploadedToolRoute = createRoute({
//   method: 'post',
//   path: '/upload/parse-tool',
//   tags: ['Tools', 'Upload'],
//   summary: 'Upload and parse tool package',
//   description:
//     'Upload a .pkg file directly to the server, parse it and store files in S3 temp directory',
//   requestBody: {
//     content: {
//       'multipart/form-data': {
//         encoding: {
//           file: {
//             contentType: 'application/octet-stream'
//           }
//         },
//         example: {
//           file: File
//         }
//       }
//     }
//   },

//   responses: {
//     200: {
//       description: 'Parsed tool information',
//       content: {
//         'application/json': {
//           schema: createResponseSchema(z.array(ToolDetailSchema))
//         }
//       }
//     },
//     400: {
//       description: 'Invalid file or parse error',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });

// // POST /run-stream - Run tool with streaming response
// export const runStreamRoute = createRoute({
//   method: 'post',
//   path: '/run-stream',
//   tags: ['Tools'],
//   summary: 'Run tool with streaming',
//   description: 'Execute a tool and receive streaming response',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: ToolRunBodySchema
//         }
//       }
//     }
//   },
//   responses: {
//     200: {
//       description: 'Streaming response',
//       content: {
//         'text/event-stream': {
//           schema: z.string()
//         }
//       }
//     },
//     404: {
//       description: 'Tool not found',
//       content: {
//         'application/json': {
//           schema: ErrorResponseSchema
//         }
//       }
//     }
//   }
// });
