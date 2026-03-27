import { createRoute, z } from '@hono/zod-openapi';
import { createOpenAPIHono, createResponseSchema, ErrorResponseSchema, R } from '@/utils/http';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import { pluginManager } from '@/modules/tool/tool.init';
import { env } from '@/env';

const PluginConfigSchema = z
  .object({
    minPods: z.number().int().min(0).default(env.PLUGIN_MIN_PODS).openapi({ example: 0 }),
    maxPods: z.number().int().positive().default(env.PLUGIN_MAX_PODS).openapi({ example: 5 }),
    maxConcurrentRequestsPerPod: z
      .number()
      .int()
      .positive()
      .default(env.PLUGIN_MAX_CONCURRENT)
      .openapi({ example: 1 })
  })
  .openapi('PluginConfig');

const PluginIdParamSchema = z.object({
  pluginId: z
    .string()
    .min(1)
    .regex(/^[^@]+@[^@]+$/, 'pluginId must be in the format author@toolId')
    .openapi({ param: { name: 'pluginId', in: 'path' }, example: 'author@my-tool' })
});

const pool = createOpenAPIHono().basePath('/pool');

/**
 * GET /api/pool/:pluginId/config
 * 查询插件进程池配置
 */
pool.openapi(
  createRoute({
    method: 'get',
    path: '/{pluginId}/config',
    tags: ['Pool'],
    summary: 'Get plugin pool config',
    description: 'Get the process pool configuration of an installed plugin',
    request: { params: PluginIdParamSchema },
    responses: {
      200: {
        description: 'Plugin pool config (null if not set)',
        content: {
          'application/json': { schema: createResponseSchema(PluginConfigSchema.nullable()) }
        }
      },
      404: {
        description: 'Plugin not found',
        content: { 'application/json': { schema: ErrorResponseSchema } }
      }
    }
  }),
  async (c) => {
    const { pluginId } = c.req.valid('param');
    const [author, toolIdName] = pluginId.split('@');
    const record = await MongoSystemPlugin.findOne({ author, toolId: toolIdName, type: 'tool' })
      .select('pluginConfig')
      .lean();

    if (!record) {
      return c.json(R.error(404, `Plugin not found: ${pluginId}`), 404);
    }

    return c.json(
      R.success(
        PluginConfigSchema.parse({
          minPods: record.pluginConfig?.minPods ?? undefined,
          maxPods: record.pluginConfig?.maxPods ?? undefined,
          maxConcurrentRequestsPerPod: record.pluginConfig?.maxConcurrentRequestsPerPod ?? undefined
        })
      ),
      200
    );
  }
);

/**
 * PUT /api/pool/:pluginId/config
 * 更新插件进程池配置，持久化到 MongoDB 并即时同步到运行时
 */
pool.openapi(
  createRoute({
    method: 'put',
    path: '/{pluginId}/config',
    tags: ['Pool'],
    summary: 'Update plugin pool config',
    description:
      'Update the process pool configuration of an installed plugin. Takes effect immediately.',
    request: {
      params: PluginIdParamSchema,
      body: {
        content: { 'application/json': { schema: PluginConfigSchema } }
      }
    },
    responses: {
      200: {
        description: 'Config updated',
        content: {
          'application/json': {
            schema: createResponseSchema(z.object({ message: z.string() }))
          }
        }
      },
      404: {
        description: 'Plugin not found',
        content: { 'application/json': { schema: ErrorResponseSchema } }
      }
    }
  }),
  async (c) => {
    const { pluginId } = c.req.valid('param');
    const pluginConfig = c.req.valid('json');

    const [author, toolIdName] = pluginId.split('@');
    const result = await MongoSystemPlugin.updateMany(
      { author, toolId: toolIdName, type: 'tool' },
      { $set: { pluginConfig } }
    );

    if (result.matchedCount === 0) {
      return c.json(R.error(404, `Plugin not found: ${pluginId}`), 404);
    }

    // 即时同步到所有正在运行的版本（globalToolId 格式为 author@toolId@version@etag）
    if (pluginManager) {
      const prefix = pluginId + '@';
      const runningIds = pluginManager.getPluginIds().filter((id) => id.startsWith(prefix));
      await Promise.allSettled(
        runningIds.map((id) => pluginManager!.updateServiceConfig(id, pluginConfig))
      );
    }

    return c.json(R.success({ message: 'ok' }), 200);
  }
);

/**
 * GET /api/pool/metrics
 * 获取所有插件进程池的运行时指标
 */
pool.openapi(
  createRoute({
    method: 'get',
    path: '/metrics',
    tags: ['Pool'],
    summary: 'Process pool metrics',
    description: 'Get runtime metrics for all plugin process pools',
    responses: {
      200: {
        description: 'Metrics data',
        content: {
          'application/json': {
            schema: createResponseSchema(
              z.object({
                global: z.object({
                  totalServices: z.number(),
                  totalPods: z.number(),
                  totalRequests: z.number(),
                  avgResponseTime: z.number(),
                  errorRate: z.number()
                }),
                plugins: z.record(z.string(), z.any())
              })
            )
          }
        }
      }
    }
  }),
  (c) => {
    if (!pluginManager) {
      return c.json(
        R.success({
          global: {
            totalServices: 0,
            totalPods: 0,
            totalRequests: 0,
            avgResponseTime: 0,
            errorRate: 0
          },
          plugins: {}
        }),
        200
      );
    }

    const global = pluginManager.getGlobalMetrics();
    const plugins: Record<string, unknown> = {};
    for (const id of pluginManager.getPluginIds()) {
      try {
        plugins[id] = pluginManager.getPluginMetrics(id);
      } catch {
        // skip
      }
    }
    return c.json(R.success({ global, plugins }), 200);
  }
);

export default pool;
