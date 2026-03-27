import { getLogger, mod } from '@/lib/logger';
import { batch, ensureDir } from '@fastgpt-plugin/helpers/index';
import { existsSync } from 'node:fs';
import { toolsDir, UploadToolsS3Path } from './constants';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import { LoadToolsByFilename } from './utils/tool';
import { getPrivateS3Server } from '@/lib/s3';
import { PluginManager } from '@/lib/plugin_manager';
import path from 'node:path';
import { env } from '@/env';
import { buildGlobalPluginId } from '@fastgpt-plugin/helpers/plugins/type';
import { SystemCacheKeyEnum } from '@/lib/cache/type';

declare global {
  var isIniting: boolean;
}

/**
 * Init tools when system starting.
 * 从 MongoDB 读取所有 system 系统预装的工具。
 * 下载 index.js 文件到本地，载入 PluginManager 中
 */
export async function initTools() {
  const logger = getLogger(mod.tool);

  if (global.isIniting) {
    return systemCache.systemTool.data;
  }
  global.isIniting = true;

  try {
    const start = Date.now();
    logger.info('Load tools start');
    await ensureDir(toolsDir);

    const pluginManager = PluginManager.getInstance();

    // 1. 从 MongoDB 获取所有工具文档
    const toolsInMongo = await MongoSystemPlugin.find({ type: 'tool', source: 'system' }).lean();
    logger.debug(`[init Tools]: Tool docs in mongo: ${toolsInMongo.length}`);

    const privateS3Server = getPrivateS3Server();

    // 2. 遍历每个工具 doc，加载最新版本
    await batch(
      50,
      toolsInMongo.map((tool) => async () => {
        const baseToolId = `${tool.author}@${tool.pluginId}`;

        const latestVersion = (tool.versionList ?? []).at(-1);
        if (!latestVersion) {
          logger.warn(`Skip tool ${baseToolId}: versionList is empty`);
          return;
        }

        const globalToolId = buildGlobalPluginId(
          tool.author,
          tool.pluginId,
          latestVersion.version,
          latestVersion.etag
        );

        const existingEntry = existingToolMap.get(baseToolId);
        if (existingEntry && pluginManager!.hasPlugin(globalToolId)) {
          // 只更新 versionList（从数据库同步）
          toolMap.set(baseToolId, existingEntry);
          return;
        }

        try {
          const jsLocalPath = path.join(toolsDir, `${globalToolId}.js`);

          // 下载 index.js（私有 S3），本地已存在时跳过
          if (!existsSync(jsLocalPath)) {
            const filepath = await privateS3Server.downloadFile({
              downloadPath: toolsDir,
              objectName: `${UploadToolsS3Path}/${globalToolId}.js`
            });
            if (!filepath) {
              logger.warn(`Skip tool ${globalToolId}: index.js download failed`);
              return;
            }
          }

          const filename = `${globalToolId}.js`;

          // 构建 toolEntry（从数据库元数据）
          const toolEntry = {
            type: tool.type,
            source: tool.source,
            author: tool.author,
            toolId: tool.toolId,
            name: tool.name,
            description: tool.description,
            toolDescription: tool.toolDescription,
            icon: tool.icon ?? undefined,
            tags: tool.tags ?? undefined,
            tutorialUrl: tool.tutorialUrl ?? undefined,
            readmeUrl: tool.readmeUrl ?? undefined,
            versionList: tool.versionList.map((v) => ({
              version: v.version,
              etag: v.etag,
              versionDescription: v.versionDescription,
              inputSchema: v.inputSchema,
              outputSchema: v.outputSchema,
              secretSchema: v.secretSchema,
              children: v.children?.map((c) => ({
                toolId: c.toolId,
                name: c.name,
                description: c.description,
                icon: c.icon ?? undefined,
                inputSchema: c.inputSchema,
                outputSchema: c.outputSchema
              }))
            }))
          };

          const loadedTool = await LoadToolsByFilename(filename, pluginManager, toolEntry, {
            minPods: tool.pluginConfig?.minPods ?? env.PLUGIN_MIN_PODS,
            maxPods: tool.pluginConfig?.maxPods ?? env.PLUGIN_MAX_PODS,
            maxConcurrentRequestsPerPod:
              tool.pluginConfig?.maxConcurrentRequestsPerPod ?? env.PLUGIN_MAX_CONCURRENT
          });
          if (!loadedTool) return;

          toolMap.set(baseToolId, {
            ...tool,
            id: baseToolId,
            filename
          });
        } catch (e) {
          logger.error(`Failed to load tool ${globalToolId}: ${e}`);
        }
      })
    );

    logger.info(`Load tools finish: ${toolMap.size}, time: ${Date.now() - start}ms`);
    return toolMap;
  } catch (e) {
    logger.error(`Load tools Error: ${e}`);
    return new Map() as CacheToolMapType;
  } finally {
    global.isIniting = false;
  }
}
