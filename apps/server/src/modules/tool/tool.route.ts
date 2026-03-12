import { getCachedData, refreshVersionKey } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { getLogger, mod } from '@/lib/logger';
import { MongoSystemPlugin, pluginTypeEnum } from '@/lib/mongo/models/plugins';
import { mongoSessionRun } from '@/lib/mongo/utils';
import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { UploadToolsS3Path, tempPkgDir } from '@/modules/tool/constants';
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
import { createOpenAPIHono, R } from '@/utils/http';
import { SSEStreamingApi, streamSSE } from 'hono/streaming';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { StreamMessageTypeEnum } from '@fastgpt-plugin/helpers/tools/schemas/req';
import { ensureDir } from '@fastgpt-plugin/helpers/common/fs';
import { batch } from '@fastgpt-plugin/helpers/common/fn';
import { getTool, getToolTags, parsePkg, parseUploadedTool, getBaseToolId } from './utils/tool';
import { getErrText } from '@/utils/err';
import { createEventEmitter } from '@/lib/events';
import { createSubPub } from '@/lib/events/init';
import { parse as parseYaml } from 'yaml';
import type { ClientSession } from 'mongoose';

const tools = createOpenAPIHono().basePath('/tools');

/**
 * 向 MongoDB 写入版本条目：若同版本号已存在则替换，否则追加。
 * 使用聚合管道 update 保证原子性。
 */
function upsertVersionEntry(
  baseToolId: string,
  versionEntry: Record<string, unknown>,
  session?: ClientSession
) {
  return MongoSystemPlugin.updateOne(
    { toolId: baseToolId, type: pluginTypeEnum.tool },
    [
      {
        $set: {
          versionList: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: ['$versionList', []] },
                  cond: { $ne: ['$$this.value', versionEntry['value']] }
                }
              },
              [versionEntry]
            ]
          }
        }
      }
    ] as Parameters<typeof MongoSystemPlugin.updateOne>[1],
    { upsert: true, ...(session ? { session } : {}) }
  );
}

/**
 * List tools
 */
tools.openapi(listToolsRoute, async (c) => {
  const cache = (await getCachedData(SystemCacheKeyEnum.systemTool)).values();
  const list = cache
    .flatMap((item) => {
      if ('children' in item) {
        return [item, ...item.children];
      } else {
        return [item];
      }
    })
    .toArray();

  const parsed = Array.from(list).map((item) => ToolDetailSchema.safeParse(item));
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
  const { toolId: rawToolId } = c.req.valid('param');
  const toolId = decodeURIComponent(rawToolId);

  const parsed = ToolDetailSchema.safeParse(await getTool(toolId));
  if (!parsed.success) {
    return c.json(R.error(404, 'Tool not found'), 404);
  }

  return c.json(R.success(parsed.data), 200);
});

// /**
//  * Get upload URL
//  */
tools.openapi(getPresignedUploadUrlRoute, async (c) => {
  const { filename } = c.req.valid('query');

  const privateS3Server = getPrivateS3Server();
  const body = await privateS3Server.generateUploadPresignedURL({
    filepath: UploadToolsS3Path,
    contentType: 'application/zip',
    maxSize: 100 * 1024 * 1024,
    filename,
    fileExpireMins: 60
  });

  return c.json(R.success(body), 200);
});

// /**
//  * Confirm upload
//  */
tools.openapi(confirmUploadRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { toolIds: _toolIds } = c.req.valid('json');
  const toolIds = [...new Set(_toolIds)];

  logger.debug(`Confirming uploaded tools: ${toolIds}`);

  const privateS3Server = getPrivateS3Server();
  const publicS3Server = getPublicS3Server();
  const pendingTools = await privateS3Server.getFiles(`${UploadToolsS3Path}/temp`);
  const pendingToolIds = pendingTools
    .map((item: string) => item.split('/').at(-1)?.split('.').at(0))
    .filter((item: string | undefined): item is string => !!item);

  if (!pendingToolIds.some((item: string) => toolIds.includes(item))) {
    return c.json(R.error(400, 'Some toolIds are invalid'), 400);
  }

  // 读取每个工具的 manifest.yaml + config.json，构建版本条目
  const toolsInfo = await Promise.all(
    toolIds.map(async (globalToolId) => {
      try {
        const manifestUrl = publicS3Server.generateExternalUrl(
          `${UploadToolsS3Path}/temp/${globalToolId}/manifest.yaml`
        );
        const configUrl = publicS3Server.generateExternalUrl(
          `${UploadToolsS3Path}/temp/${globalToolId}/config.json`
        );
        const [manifestContent, configJson] = await Promise.all([
          fetch(manifestUrl).then((r) => r.text()),
          fetch(configUrl)
            .then((r) => r.json())
            .catch(() => ({}))
        ]);
        const manifest = parseYaml(manifestContent);
        const baseToolId = getBaseToolId(globalToolId);

        // 工具集：versionEntry.children 存各子工具 schema；单工具：直接存 inputSchema/outputSchema
        const isToolset =
          manifest.children && Object.keys(manifest.children as object).length > 0;
        const versionEntry = isToolset
          ? {
              value: manifest.version as string,
              children: Object.keys(manifest.children as object).map((childName) => ({
                toolId: childName,
                inputSchema: (configJson as any)[childName]?.inputSchema,
                outputSchema: (configJson as any)[childName]?.outputSchema
              }))
            }
          : {
              value: manifest.version as string,
              inputSchema: (configJson as any).inputSchema,
              outputSchema: (configJson as any).outputSchema
            };

        return { globalToolId, baseToolId, versionEntry };
      } catch (error) {
        logger.warn(`Failed to read manifest for ${globalToolId}`, { error });
        return null;
      }
    })
  );
  const validToolsInfo = toolsInfo.filter(<T>(x: T): x is NonNullable<T> => !!x);

  await mongoSessionRun(async (session) => {
    // 对每个工具 upsert：baseToolId 已存在则追加版本，不存在则新建
    for (const { baseToolId, versionEntry } of validToolsInfo) {
      await upsertVersionEntry(baseToolId, versionEntry, session);
    }

    for (const { globalToolId } of validToolsInfo) {
      await publicS3Server.moveFiles(
        `${UploadToolsS3Path}/temp/${globalToolId}`,
        `${UploadToolsS3Path}/${globalToolId}`
      );
      await privateS3Server.moveFile(
        `${UploadToolsS3Path}/temp/${globalToolId}.js`,
        `${UploadToolsS3Path}/${globalToolId}.js`
      );
    }
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  logger.debug(`Confirmed uploaded tools: ${validToolsInfo.map((t) => t.globalToolId)}`);

  return c.json(R.success({ message: 'ok' }), 200 as const);
});

/**
 * Delete tool
 */
tools.openapi(deleteToolRoute, async (c) => {
  const logger = getLogger(mod.tool);
  const { toolId } = c.req.valid('query');
  const privateS3Server = getPrivateS3Server();
  const publicS3Server = getPublicS3Server();
  const res = await mongoSessionRun(async (session) => {
    const result = await MongoSystemPlugin.findOneAndDelete({ toolId }).session(session);
    if (!result || !result.toolId) {
      return {
        status: 404 as const,
        error: `Tool with toolId ${toolId} not found in MongoDB`
      };
    }

    // 删除所有版本的 S3 文件（每个版本 index.js 在私有 S3，静态文件在公开 S3）
    const versions = (result.versionList ?? []).map((v: { value: string }) => v.value);
    await Promise.all(
      versions.map(async (version: string) => {
        const globalToolId = `${result.toolId}@${version}`;
        const files = await publicS3Server.getFiles(`${UploadToolsS3Path}/${globalToolId}`);
        await publicS3Server.removeFiles(files);
        await privateS3Server.removeFile(`${UploadToolsS3Path}/${globalToolId}.js`);
      })
    );
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

    const tool = await parsePkg(pkgSavePath, false);
    if (!tool?.toolId) return null;
    const versionEntry = tool.versionList?.[0];
    return { baseToolId: getBaseToolId(tool.toolId), versionEntry };
  });

  const toolsInfo = (await batch(5, downloadFunctions)).filter(
    <T>(item: T): item is NonNullable<T> => !!item
  );

  await Promise.all(
    toolsInfo.map(({ baseToolId, versionEntry }) => upsertVersionEntry(baseToolId, versionEntry))
  );

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);
  logger.info(`Success installed tools: ${toolsInfo.map((t) => t.baseToolId)}`);

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
  if (!res) return c.json(R.error(400, 'Parse tool error'), 400);

  logger.debug(`Parsed tool: ${res?.toolId}`);
  return c.json(R.success([res]), 200);
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
      data: JSON.stringify({ type: StreamMessageTypeEnum.error, data: getErrText(error) })
    });
  };

  return streamSSE(
    c,
    async (stream) => {
      const sp = createSubPub({ stream });
      try {
        const handleStreamAbort = () => logger.info(`Stream aborted for tool: ${toolId}`);
        stream.onAbort(handleStreamAbort);
        const emitter = createEventEmitter(sp, { systemVar });

        logger.debug('Run tool start', { body: { toolId, inputs, systemVar } });

        const result = await tool.handler(inputs, { systemVar, emitter });
        if (result.error) {
          logger.debug(`Run tool '${toolId}' failed`, { error: result.error });
          return await handleSendError(result.error, stream);
        }

        logger.debug(`Run tool '${toolId}' success`);
        const data = JSON.stringify({ type: StreamMessageTypeEnum.response, data: result });
        await stream.writeSSE({ data });
      } finally {
        sp.removeAllListeners();
      }
    },
    async (error, stream) => {
      await handleSendError(error, stream);
    }
  );
});

export default tools;
