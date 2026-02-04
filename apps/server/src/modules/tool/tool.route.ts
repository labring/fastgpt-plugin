import { getCachedData, refreshVersionKey } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { getLogger, mod } from '@/lib/logger';
import { MongoSystemPlugin, pluginTypeEnum } from '@/lib/mongo/models/plugins';
import { mongoSessionRun } from '@/lib/mongo/utils';
import { privateS3Server, publicS3Server } from '@/lib/s3';
import { UploadToolsS3Path, tempPkgDir } from '@/modules/tool/constants';
import { getToolTags, getTool } from '@/modules/tool/controller';
import {
  listToolsRoute,
  ToolDetailSchema,
  getTagsRoute,
  getToolRoute,
  getPresignedUploadUrlRoute,
  confirmUploadRoute,
  deleteToolRoute,
  installToolRoute,
  parseUploadedToolRoute,
  runStreamRoute
} from '@/modules/tool/schemas';
import { parsePkg, parseUploadedTool } from '@/modules/tool/utils';
import { runWithToolContext } from '@/modules/tool/utils/context';
import { getErrText } from '@/modules/tool/utils/err';
import { createOpenAPIHono, R } from '@/utils/http';
import { dispatchWithNewWorker } from '@/utils/worker';
import { SSEStreamingApi, streamSSE } from 'hono/streaming';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import {
  StreamMessageTypeEnum,
  type StreamDataType
} from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { ToolCallbackReturnType } from '@fastgpt-plugin/helpers/tools/schemas/tool';
import { ensureDir } from '@fastgpt-plugin/helpers/common/fs';
import { batch } from '@fastgpt-plugin/helpers/common/fn';

const tools = createOpenAPIHono().basePath('/tools');

/**
 * List tools
 */
tools.openapi(listToolsRoute, async (c) => {
  const cache = await getCachedData(SystemCacheKeyEnum.systemTool);
  const parsed = Array.from(cache.values()).map((item) => ToolDetailSchema.safeParse(item));
  const data = parsed.filter((item) => item.success).map((item) => item.data!);

  return c.json(R.success(data));
});

/**
 * Get tags
 */
tools.openapi(getTagsRoute, async (c) => {
  const tags = getToolTags();
  return c.json(R.success(tags));
});

/**
 * Get a tool
 */
tools.openapi(getToolRoute, async (c) => {
  const { toolId } = c.req.valid('param');

  const parsed = ToolDetailSchema.safeParse(await getTool(toolId));
  if (!parsed.success) {
    return c.json(R.error(404, 'Tool not found'), 404);
  }

  return c.json(R.success(parsed.data), 200);
});

/**
 * Get upload URL
 */
tools.openapi(getPresignedUploadUrlRoute, async (c) => {
  const { filename } = c.req.valid('query');

  const body = await privateS3Server.generateUploadPresignedURL({
    filepath: UploadToolsS3Path,
    contentType: 'application/zip',
    maxSize: 100 * 1024 * 1024,
    filename,
    fileExpireMins: 60
  });

  return c.json(R.success(body), 200);
});

/**
 * Confirm upload
 */
tools.openapi(confirmUploadRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { toolIds: _toolIds } = c.req.valid('json');
  const toolIds = [...new Set(_toolIds)];

  logger.debug(`Confirming uploaded tools: ${toolIds}`);

  const pendingTools = await privateS3Server.getFiles(`${UploadToolsS3Path}/temp`);
  const pendingToolIds = pendingTools
    .map((item) => item.split('/').at(-1)?.split('.').at(0))
    .filter((item): item is string => !!item);

  if (!pendingToolIds.some((item) => toolIds.includes(item))) {
    return c.json(R.error(400, 'Some toolIds are invalid'), 400);
  }

  await mongoSessionRun(async (session) => {
    const allToolsInstalled = (
      await MongoSystemPlugin.find({ type: pluginTypeEnum.enum.tool }).lean()
    ).map((tool) => tool.toolId);
    await MongoSystemPlugin.create(
      toolIds
        .filter((toolId) => !allToolsInstalled.includes(toolId))
        .map((toolId) => ({
          toolId,
          type: pluginTypeEnum.enum.tool
        })),
      {
        session,
        ordered: true
      }
    );

    for await (const toolId of toolIds) {
      if (toolId) {
        await publicS3Server.moveFiles(
          `${UploadToolsS3Path}/temp/${toolId}`,
          `${UploadToolsS3Path}/${toolId}`
        );
        await privateS3Server.moveFile(
          `${UploadToolsS3Path}/temp/${toolId}.js`,
          `${UploadToolsS3Path}/${toolId}.js`
        );
      }
    }
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  logger.debug(`Confirmed uploaded tools: ${toolIds}`);

  return c.json(R.success({ message: 'ok' }), 200 as const);
});

/**
 * Delete tool
 */
tools.openapi(deleteToolRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { toolId } = c.req.valid('query');
  const res = await mongoSessionRun(async (session) => {
    const result = await MongoSystemPlugin.findOneAndDelete({ toolId }).session(session);
    if (!result || !result.toolId) {
      return {
        status: 404 as const,
        error: `Tool with toolId ${toolId} not found in MongoDB`
      };
    }
    // Remove public files(Avatar,readme)
    const files = await publicS3Server.getFiles(`${UploadToolsS3Path}/${result.toolId}`);

    await publicS3Server.removeFiles(files);

    // Remove private file(index.js)
    await privateS3Server.removeFile(`${UploadToolsS3Path}/${result.toolId}.js`);
    return null;
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  if (res) {
    return c.json(R.error(res.status, res.error), 404);
  }
  logger.debug(`Deleted tool: ${toolId}`);

  return c.json(R.success({ message: 'Tool deleted successfully' }), 200);
});

/**
 * Install tool
 */
tools.openapi(installToolRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { urls } = c.req.valid('json');
  logger.debug(`Installing tools: ${urls}`);
  await ensureDir(tempPkgDir);
  const downloadFunctions = urls.map((url) => async () => {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const pkgSavePath = path.join(tempPkgDir, url.split('/').at(-1) as string);
    // Write the buffer directly to file
    await writeFile(pkgSavePath, Buffer.from(buffer));

    const tools = await parsePkg(pkgSavePath, false);
    const tool = tools.find((item) => !item.parentId);
    return tool?.toolId;
  });

  const toolIds = (await batch(5, downloadFunctions)).filter(
    <T>(item: T): item is NonNullable<T> => !!item
  );

  const allToolsInstalled = (
    await MongoSystemPlugin.find({ type: pluginTypeEnum.enum.tool }).lean()
  ).map((tool) => tool.toolId);
  // create all that not exists
  await MongoSystemPlugin.create(
    toolIds
      .filter((toolId) => !allToolsInstalled.includes(toolId))
      .map((toolId) => ({
        toolId,
        type: pluginTypeEnum.enum.tool
      })),
    {
      ordered: true
    }
  );

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);
  logger.info(`Success installed tools: ${toolIds}`);

  return c.json(R.success({ message: 'ok' }), 200);
});

/**
 * Parse uploaded tool
 */
tools.openapi(parseUploadedToolRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { objectName } = c.req.valid('query');
  logger.debug(`Parsing uploaded tool: ${objectName}`);
  const res = await parseUploadedTool(objectName);

  logger.debug(`Parsed tool: ${res.map((item) => item.toolId)}`);
  return c.json(R.success(res), 200);
});

/**
 * Run tool stream
 */
tools.openapi(runStreamRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { toolId, inputs, systemVar } = c.req.valid('json');

  const tool = await getTool(toolId);

  if (!tool) {
    logger.error('Tool not found', { body: { toolId } });
    return c.json(R.error(404, 'tool not found'), 404);
  }

  const handleSendError = async (error: unknown, stream: SSEStreamingApi) => {
    logger.error(`Run tool '${toolId}' error: ${error}`, { error });
    await stream.writeSSE({
      data: JSON.stringify({ type: StreamMessageTypeEnum.enum.error, data: getErrText(error) })
    });
  };

  return streamSSE(
    c,
    async (stream) => {
      const handleSend = async (e: StreamDataType) => {
        const data = JSON.stringify({ type: StreamMessageTypeEnum.enum.stream, data: e });
        await stream.writeSSE({ data });
      };

      const handleStreamAbort = () => logger.info(`Stream aborted for tool: ${toolId}`);
      stream.onAbort(handleStreamAbort);

      let result: ToolCallbackReturnType;
      if (tool.isWorkerRun === true) {
        logger.debug('Run tool start in worker', { body: { toolId, inputs, systemVar } });
        result = await dispatchWithNewWorker({
          toolId,
          inputs,
          systemVar,
          onMessage: handleSend
        });
      } else {
        logger.debug('Run tool start in main thread', { body: { toolId, inputs, systemVar } });
        const context = { prefix: systemVar?.tool?.prefix };
        const executor = () => tool.cb(inputs, { systemVar, streamResponse: handleSend });
        result = await runWithToolContext(context, executor);
      }

      if (result.error) {
        logger.debug(`Run tool '${toolId}' failed`, { error: result.error });
        return await handleSendError(result.error, stream);
      }

      logger.debug(`Run tool '${toolId}' success`);
      const data = JSON.stringify({ type: StreamMessageTypeEnum.enum.response, data: result });
      await stream.writeSSE({ data });
    },
    async (error, stream) => {
      await handleSendError(error, stream);
    }
  );
});

export default tools;
