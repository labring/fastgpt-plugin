import { getLogger, mod } from '@/lib/logger';
import { batch, ensureDir } from '@fastgpt-plugin/helpers/index';
import { existsSync } from 'node:fs';
import { toolsDir, UploadToolsS3Path } from './constants';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import type { CacheToolMapType } from './types/tool';
import { LoadToolsByFilename } from './utils/tool';
import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { PluginManager } from '@/lib/plugin_manager';
import type { ToolType, ToolSetType } from '@fastgpt-plugin/helpers/tools/schemas/tool';
import path from 'node:path';
import { env } from '@/env';

declare global {
  var isIniting: boolean;
}

/** 全局 PluginManager 单例，由 initTools 初始化 */
export let pluginManager: PluginManager | null = null;

/**
 * Init tools when system starting.
 * 从 MongoDB 取 baseToolId + versionList，下载最新版本的文件，
 * 加载后覆盖 toolId 为 baseToolId，并从 MongoDB 合并完整 versionList。
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

    // 初始化 PluginManager 单例（复用已有实例，避免重建时销毁正在运行的 pods）
    if (!pluginManager) {
      pluginManager = new PluginManager({ mode: 'ipc', maxTotalPods: 100 });
    }

    // 1. 从 MongoDB 获取所有工具记录（toolId = author@name）
    const toolsInMongo = await MongoSystemPlugin.find({ type: 'tool' }).lean();
    logger.debug(`Tools in mongo: ${toolsInMongo.length}`);

    const toolMap: CacheToolMapType = new Map();
    const privateS3Server = getPrivateS3Server();
    const publicS3Server = getPublicS3Server();

    // 取已有 toolMap（用于复用未变化的工具条目）
    const existingToolMap: CacheToolMapType = global.systemCache?.systemTool?.data ?? new Map();

    // 2. 下载最新版本文件并加载（单个工具失败不影响其他工具）
    await batch(
      50,
      toolsInMongo.map((tool) => async () => {
        const baseToolId = tool.toolId; // author@name
        const versions = tool.versionList ?? [];
        if (versions.length === 0) return;

        // 取最后一项作为最新版本（按安装顺序）
        const latestVersion = versions[versions.length - 1].value;
        const globalToolId = `${baseToolId}@${latestVersion}`;
        const toolDir = path.join(toolsDir, globalToolId);

        const mongoVersionList = versions.map((v) => ({
          value: v.value,
          inputSchema: v.inputSchema,
          outputSchema: v.outputSchema,
          children: v.children
        }));

        // 若该版本已在 PluginManager 中注册且 toolMap 已有数据，直接复用，仅刷新 versionList
        const existingEntry = existingToolMap.get(baseToolId);
        if (existingEntry && pluginManager!.hasPlugin(globalToolId)) {
          toolMap.set(baseToolId, { ...existingEntry, versionList: mongoVersionList });
          return;
        }

        try {
          const jsLocalPath = path.join(toolsDir, `${globalToolId}.js`);
          const manifestLocalPath = path.join(toolDir, 'manifest.yaml');

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

          // 下载 manifest.yaml（公开 S3），本地已存在时跳过
          if (!existsSync(manifestLocalPath)) {
            await ensureDir(toolDir);
            const manifestPath = await publicS3Server.downloadFile({
              downloadPath: toolDir,
              objectName: `${UploadToolsS3Path}/${globalToolId}/manifest.yaml`
            });
            if (!manifestPath) {
              logger.warn(`Skip tool ${globalToolId}: manifest.yaml download failed`);
              return;
            }
          }

          // 下载 config.json（公开 S3，可选），本地已存在时跳过
          const configLocalPath = path.join(toolDir, 'config.json');
          if (!existsSync(configLocalPath)) {
            await publicS3Server
              .downloadFile({
                downloadPath: toolDir,
                objectName: `${UploadToolsS3Path}/${globalToolId}/config.json`
              })
              .catch(() => {
                /* config.json 可选 */
              });
          }

          const filename = `${globalToolId}.js`;
          const loadedTool = await LoadToolsByFilename(filename, pluginManager!, {
            minPods: tool.pluginConfig?.minPods ?? env.PLUGIN_MIN_PODS,
            maxPods: tool.pluginConfig?.maxPods ?? env.PLUGIN_MAX_PODS,
            maxConcurrentRequestsPerPod:
              tool.pluginConfig?.maxConcurrentRequestsPerPod ?? env.PLUGIN_MAX_CONCURRENT
          });
          if (!loadedTool) return;

          // 3. 覆盖 toolId 为 baseToolId，合并来自 MongoDB 的完整 versionList
          if ('children' in loadedTool && Array.isArray(loadedTool.children)) {
            // 工具集：同步覆盖所有子工具的 toolId（global → base），不携带 versionList
            const children = (loadedTool as ToolSetType).children.map((child: ToolType) => ({
              ...child,
              toolId: `${baseToolId}/${child.toolId.split('/').at(-1)}`
            }));
            toolMap.set(baseToolId, {
              ...(loadedTool as ToolSetType),
              toolId: baseToolId,
              versionList: mongoVersionList,
              children
            });
          } else {
            toolMap.set(baseToolId, {
              ...(loadedTool as ToolType),
              toolId: baseToolId,
              versionList: mongoVersionList
            });
          }
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
