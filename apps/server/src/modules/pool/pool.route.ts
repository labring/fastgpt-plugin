import { createRoute, z } from '@hono/zod-openapi';
import { createOpenAPIHono, createResponseSchema, ErrorResponseSchema, R } from '@/utils/http';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import { pluginManager } from '@/modules/tool/tool.init';

const PluginConfigSchema = z
  .object({
    minPods: z.number().int().min(0).optional().openapi({ example: 0 }),
    maxPods: z.number().int().positive().optional().openapi({ example: 5 }),
    maxConcurrentRequestsPerPod: z.number().int().positive().optional().openapi({ example: 1 })
  })
  .openapi('PluginConfig');

const PluginIdParamSchema = z.object({
  pluginId: z
    .string()
    .min(1)
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
    const record = await MongoSystemPlugin.findOne({ toolId: pluginId, type: 'tool' })
      .select('pluginConfig')
      .lean();

    if (!record) {
      return c.json(R.error(404, `Plugin not found: ${pluginId}`), 404);
    }

    return c.json(R.success(record.pluginConfig ?? null), 200);
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
    description: 'Update the process pool configuration of an installed plugin. Takes effect immediately.',
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

    const result = await MongoSystemPlugin.findOneAndUpdate(
      { toolId: pluginId, type: 'tool' },
      { $set: { pluginConfig } },
      { new: false }
    ).lean();

    if (!result) {
      return c.json(R.error(404, `Plugin not found: ${pluginId}`), 404);
    }

    // 即时同步到所有正在运行的版本（globalToolId 格式为 baseToolId@version）
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

export default pool;
