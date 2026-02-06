import { R, createOpenAPIHono } from '@/utils/http';
import { sourceRegistry } from './source/registry';
import {
  listSourcesRoute,
  getSourceConfigRoute,
  listFilesRoute,
  getContentRoute,
  getPreviewUrlRoute,
  getDetailRoute
} from './schemas/routes';

// 延迟注册数据源，避免在模块加载时触发 S3 访问
let sourcesRegistered = false;
async function ensureSourcesRegistered() {
  if (sourcesRegistered) return;

  // 动态导入数据源，此时 S3 已经初始化
  const [customApiSource, feishuSource, yuqueSource] = await Promise.all([
    import('./sources/custom-api'),
    import('./sources/feishu'),
    import('./sources/yuque')
  ]);

  sourceRegistry.register(customApiSource.default);
  sourceRegistry.register(feishuSource.default);
  sourceRegistry.register(yuqueSource.default);

  sourcesRegistered = true;
}

// Create dataset router
const dataset = createOpenAPIHono().basePath('/dataset');

/**
 * List all dataset sources
 */
dataset.openapi(listSourcesRoute, async (c) => {
  await ensureSourcesRegistered();
  const sources = sourceRegistry.list();
  const sourcesInfo = sources.map(({ formFields, ...info }) => info);
  return c.json(R.success(sourcesInfo), 200);
});

/**
 * Get dataset source config
 */
dataset.openapi(getSourceConfigRoute, async (c) => {
  await ensureSourcesRegistered();
  const { sourceId } = c.req.valid('query');
  const config = sourceRegistry.list().find((s) => s.sourceId === sourceId);

  if (!config) {
    return c.json(R.error(404, `Source not found: ${sourceId}`), 404);
  }

  return c.json(R.success(config), 200);
});

/**
 * List files from dataset source
 */
dataset.openapi(listFilesRoute, async (c) => {
  await ensureSourcesRegistered();
  const body = c.req.valid('json');
  const callbacks = sourceRegistry.getCallbacks(body.sourceId);

  if (!callbacks) {
    return c.json(R.error(404, `Source not found: ${body.sourceId}`), 404);
  }

  try {
    const files = await callbacks.listFiles({
      config: body.config,
      parentId: body.parentId
    });
    return c.json(R.success(files), 200);
  } catch (error) {
    return c.json(R.error(400, error instanceof Error ? error.message : 'Unknown error'), 400);
  }
});

/**
 * Get file content
 */
dataset.openapi(getContentRoute, async (c) => {
  await ensureSourcesRegistered();
  const body = c.req.valid('json');
  const callbacks = sourceRegistry.getCallbacks(body.sourceId);

  if (!callbacks) {
    return c.json(R.error(404, `Source not found: ${body.sourceId}`), 404);
  }

  try {
    const content = await callbacks.getFileContent({
      config: body.config,
      fileId: body.fileId
    });
    return c.json(R.success(content), 200);
  } catch (error) {
    return c.json(R.error(400, error instanceof Error ? error.message : 'Unknown error'), 400);
  }
});

/**
 * Get file preview URL
 */
dataset.openapi(getPreviewUrlRoute, async (c) => {
  await ensureSourcesRegistered();
  const body = c.req.valid('json');
  const callbacks = sourceRegistry.getCallbacks(body.sourceId);

  if (!callbacks) {
    return c.json(R.error(404, `Source not found: ${body.sourceId}`), 404);
  }

  try {
    const url = await callbacks.getFilePreviewUrl({
      config: body.config,
      fileId: body.fileId
    });
    return c.json(R.success({ url }), 200);
  } catch (error) {
    return c.json(R.error(400, error instanceof Error ? error.message : 'Unknown error'), 400);
  }
});

/**
 * Get file detail
 */
dataset.openapi(getDetailRoute, async (c) => {
  await ensureSourcesRegistered();
  const body = c.req.valid('json');
  const callbacks = sourceRegistry.getCallbacks(body.sourceId);

  if (!callbacks) {
    return c.json(R.error(404, `Source not found: ${body.sourceId}`), 404);
  }

  try {
    const detail = await callbacks.getFileDetail({
      config: body.config,
      fileId: body.fileId
    });
    return c.json(R.success(detail), 200);
  } catch (error) {
    return c.json(R.error(400, error instanceof Error ? error.message : 'Unknown error'), 400);
  }
});

export default dataset;
