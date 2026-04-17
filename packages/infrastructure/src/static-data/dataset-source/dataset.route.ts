// import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';

// import {
//   getContentRoute,
//   getDetailRoute,
//   getPreviewUrlRoute,
//   getSourceConfigRoute,
//   listFilesRoute,
//   listSourcesRoute} from './schemas/routes';
// import { sourceRegistry } from './source/registry';

// // 延迟注册数据源，避免在模块加载时触发 S3 访问
// let sourcesRegistered = false;
// async function ensureSourcesRegistered() {
//   if (sourcesRegistered) return;

//   // 动态导入数据源，此时 S3 已经初始化
//   const [customApiSource, feishuSource, yuqueSource] = await Promise.all([
//     import('./sources/custom-api'),
//     import('./sources/feishu'),
//     import('./sources/yuque')
//   ]);

//   sourceRegistry.register(customApiSource.default);
//   sourceRegistry.register(feishuSource.default);
//   sourceRegistry.register(yuqueSource.default);

//   sourcesRegistered = true;
// }

// // Create dataset router
// const dataset = createOpenAPIHono().basePath('/dataset');

// /**
//  * List all dataset sources
//  */
// dataset.openapi(listSourcesRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const sources = sourceRegistry.list();
//   const sourcesInfo = sources.map(({ ...info }) => info);
//   return R.success(c, sourcesInfo);
// });

// /**
//  * Get dataset source config
//  */
// dataset.openapi(getSourceConfigRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const { sourceId } = c.req.valid('query');
//   const config = sourceRegistry.list().find((s) => s.sourceId === sourceId);

//   if (!config) {
//     return R.error(c, 404, `Source not found: ${sourceId}`);
//   }

//   return R.success(c, config);
// });

// /**
//  * List files from dataset source
//  */
// dataset.openapi(listFilesRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const body = c.req.valid('json');
//   const callbacks = sourceRegistry.getCallbacks(body.sourceId);

//   if (!callbacks) {
//     return R.error(c, 404, `Source not found: ${body.sourceId}`);
//   }

//   try {
//     const files = await callbacks.listFiles({
//       config: body.config,
//       parentId: body.parentId
//     });
//     return R.success(c, files);
//   } catch (error) {
//     return R.error(c, 400, error instanceof Error ? error.message : 'Unknown error');
//   }
// });

// /**
//  * Get file content
//  */
// dataset.openapi(getContentRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const body = c.req.valid('json');
//   const callbacks = sourceRegistry.getCallbacks(body.sourceId);

//   if (!callbacks) {
//     return R.error(c, 404, `Source not found: ${body.sourceId}`);
//   }

//   try {
//     const content = await callbacks.getFileContent({
//       config: body.config,
//       fileId: body.fileId
//     });
//     return R.success(c, content);
//   } catch (error) {
//     return R.error(c, 400, error instanceof Error ? error.message : 'Unknown error');
//   }
// });

// /**
//  * Get file preview URL
//  */
// dataset.openapi(getPreviewUrlRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const body = c.req.valid('json');
//   const callbacks = sourceRegistry.getCallbacks(body.sourceId);

//   if (!callbacks) {
//     return R.error(c, 404, `Source not found: ${body.sourceId}`);
//   }

//   try {
//     const url = await callbacks.getFilePreviewUrl({
//       config: body.config,
//       fileId: body.fileId
//     });
//     return R.success(c, { url });
//   } catch (error) {
//     return R.error(c, 400, error instanceof Error ? error.message : 'Unknown error');
//   }
// });

// /**
//  * Get file detail
//  */
// dataset.openapi(getDetailRoute, async (c) => {
//   await ensureSourcesRegistered();
//   const body = c.req.valid('json');
//   const callbacks = sourceRegistry.getCallbacks(body.sourceId);

//   if (!callbacks) {
//     return R.error(c, 404, `Source not found: ${body.sourceId}`);
//   }

//   try {
//     const detail = await callbacks.getFileDetail({
//       config: body.config,
//       fileId: body.fileId
//     });
//     return R.success(c, detail);
//   } catch (error) {
//     return R.error(c, 400, error instanceof Error ? error.message : 'Unknown error');
//   }
// });

// export default dataset;
