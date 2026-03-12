import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { tempPkgDir, tempToolsDir, toolsDir, UploadToolsS3Path } from '../constants';
import {
  ToolDetailSchema,
  ToolTagEnum,
  ToolTagSchema,
  buildGlobalToolId,
  type ToolDistType,
  type ToolSetType,
  type ToolType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';
import path, { parse } from 'node:path';
import { mimeMap } from '@/lib/s3/const';
import { catchError, ToolTagsNameMap, unpkg } from '@fastgpt-plugin/helpers/index';
import { loadManifest } from '@fastgpt-plugin/helpers/tools/helper';
import { readdir, readFile, stat, rm } from 'node:fs/promises';
import { getLogger, mod } from '@/lib/logger';
import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import type z from 'zod';
import type { ToolTagListSchema } from '../schemas';
import { pipeline } from 'node:stream/promises';
import { getErrText } from '@/utils/err';
import type { PluginManager } from '@/lib/plugin_manager';
import type { ToolHandlerReturnType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { ServiceConfig } from '@/lib/process_pool/types';

const logger = getLogger(mod.tool);

/**
 * 从全局 toolId（author@name@version）中提取基础 toolId（author@name）。
 * 通过 lastIndexOf('@') 去掉最后的 @version 部分。
 */
export function getBaseToolId(globalToolId: string): string {
  const lastAt = globalToolId.lastIndexOf('@');
  return lastAt > 0 ? globalToolId.substring(0, lastAt) : globalToolId;
}

export const getS3ToolStaticFileURL = ({
  toolId,
  temp,
  filepath
}: {
  toolId: string;
  temp: boolean;
  filepath: string;
}) => {
  const publicS3Server = getPublicS3Server();
  return publicS3Server.generateExternalUrl(
    `${UploadToolsS3Path}${temp ? '/temp' : ''}/${toolId}/${filepath}`
  );
};

/**
 * 读取工具目录下的 config.json，返回解析后的对象。
 * 若不存在或解析失败，返回空对象。
 */
async function readConfigJson(dir: string): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(path.join(dir, 'config.json'), 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * 根据 manifest 和 config.json 构建 ToolDistType。
 * - 工具集：children 不携带 versionList，各子工具的 schema 放入父级 versionList.children
 * - 单工具：versionList 的 inputSchema/outputSchema 来自 config.json
 */
function buildRootMod(
  manifest: Awaited<ReturnType<typeof loadManifest>>,
  configJson: Record<string, unknown>,
  toolId: string,
  filename: string
): ToolDistType {
  if (manifest.children && Object.keys(manifest.children).length > 0) {
    // 工具集：各子工具的 schema 放入父级 versionList.children，子工具本身不携带 versionList
    const versionChildren = Object.entries(manifest.children).map(([childName, _childConfig]) => {
      const childEntry = configJson[childName] as
        | { inputSchema: unknown; outputSchema: unknown }
        | undefined;
      return {
        toolId: childName,
        inputSchema: childEntry?.inputSchema,
        outputSchema: childEntry?.outputSchema
      };
    });

    const children = Object.entries(manifest.children).map(([childName, childConfig]) => ({
      toolId: `${toolId}/${childName}`,
      name: childConfig.name,
      description: childConfig.description,
      toolDescription: childConfig.description.en ?? '',
      icon: childConfig.icon,
      tags: manifest.tags,
      filename,
      handler: null as never
      // 无 versionList
    }));

    return {
      ...manifest,
      toolId,
      versionList: [
        {
          value: manifest.version,
          description: manifest.versionDescription?.en,
          children: versionChildren
        }
      ],
      children
    } as unknown as ToolDistType;
  }

  const schemas = configJson as { inputSchema?: unknown; outputSchema?: unknown };
  return {
    ...manifest,
    toolId,
    handler: null as never,
    versionList: [
      {
        value: manifest.version,
        description: manifest.versionDescription?.en,
        inputSchema: schemas.inputSchema,
        outputSchema: schemas.outputSchema
      }
    ]
  } as unknown as ToolDistType;
}

export const parseMod = async ({
  rootMod,
  filename,
  pluginManager,
  temp = false
}: {
  rootMod: ToolDistType;
  filename: string;
  /** 提供时为工具注入可调用的 handler（运行时加载使用，安装预览时不需要）*/
  pluginManager?: PluginManager;
  temp?: boolean;
}) => {
  const isToolset =
    'children' in rootMod &&
    Array.isArray(rootMod.children) &&
    (rootMod.children as unknown[]).length > 0;

  if (isToolset) {
    const toolsetId = rootMod.toolId;

    const parentIcon =
      rootMod.icon || getS3ToolStaticFileURL({ toolId: toolsetId, temp, filepath: 'logo' });

    const readmeUrl = getS3ToolStaticFileURL({
      toolId: toolsetId,
      temp,
      filepath: 'README.md'
    });

    const children = ((rootMod as ToolSetType).children as ToolType[]).map((child) => {
      const childName = child.toolId.split('/').at(-1)!;
      return {
        ...child,
        icon:
          child.icon || getS3ToolStaticFileURL({ toolId: child.toolId, temp, filepath: 'logo' }),
        readmeUrl,
        ...(pluginManager
          ? {
              handler: async (
                inputs: Record<string, unknown>,
                ctx: { systemVar: Record<string, unknown> }
              ) =>
                pluginManager.invoke(toolsetId, 'execute', {
                  toolName: childName,
                  inputs,
                  systemVar: ctx.systemVar
                }) as Promise<ToolHandlerReturnType>
            }
          : {})
      };
    });

    return {
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.other],
      toolId: toolsetId,
      icon: parentIcon,
      filename,
      readmeUrl,
      children
    } as ToolSetType;
  } else {
    const toolId = rootMod.toolId;
    const icon = rootMod.icon || getS3ToolStaticFileURL({ toolId, filepath: 'logo', temp });
    const readmeUrl = getS3ToolStaticFileURL({ toolId, filepath: 'README.md', temp });

    return {
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.tools],
      icon,
      toolId,
      filename,
      readmeUrl,
      ...(pluginManager
        ? {
            handler: async (
              inputs: Record<string, unknown>,
              ctx: { systemVar: Record<string, unknown> }
            ) =>
              pluginManager.invoke(toolId, 'execute', {
                inputs,
                systemVar: ctx.systemVar
              }) as Promise<ToolHandlerReturnType>
          }
        : {})
    } as ToolType;
  }
};

export const parsePkg = async (filepath: string, temp: boolean = true) => {
  const filename = filepath.split('/').pop() as string;
  const tempDir = path.join(tempToolsDir, filename);
  const [, err] = await catchError(() => unpkg(filepath, tempDir));
  if (err) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return;
  }

  // 1. 读取 manifest.yaml
  const manifestPath = path.join(tempDir, 'manifest.yaml');
  const manifest = await loadManifest(manifestPath);
  const toolId = buildGlobalToolId(manifest.author, manifest.toolId, manifest.version);

  // 2. 读取 config.json（schemas）
  const configJson = await readConfigJson(tempDir);

  // 3. 构建 rootMod（不含 handler，安装预览时不需要）
  const rootMod = buildRootMod(manifest, configJson, toolId, filename);
  console.debug('buildRootMod', rootMod);

  // 4. 上传静态文件（非 index.js）到公开 S3
  const files = await readdir(tempDir, { recursive: true });
  const publicS3Server = getPublicS3Server();
  const privateS3Server = getPrivateS3Server();

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(tempDir, file);
      if ((await stat(filePath)).isDirectory() || file === 'index.js') return;

      const basename = path.basename(file);
      // logo 去掉扩展名（统一存为 "logo"，兼容任意图片格式）；其他文件保留完整文件名
      const s3Filename = /^logo\./i.test(basename)
        ? basename.split('.').slice(0, -1).join('.')
        : basename;

      const prefix = temp
        ? `${UploadToolsS3Path}/temp/${toolId}`
        : `${UploadToolsS3Path}/${toolId}`;
      await publicS3Server.uploadFileAdvanced({
        path: filePath,
        defaultFilename: s3Filename,
        prefix,
        keepRawFilename: true,
        contentType: mimeMap[parse(filePath).ext],
        ...(temp ? { expireMins: 60 } : {})
      });
    })
  );

  // 5. 上传 index.js 到私有 S3
  await privateS3Server.uploadFileAdvanced({
    path: path.join(tempDir, 'index.js'),
    prefix: temp ? `${UploadToolsS3Path}/temp` : UploadToolsS3Path,
    defaultFilename: toolId + '.js',
    keepRawFilename: true,
    ...(temp ? { expireMins: 60 } : {})
  });

  const tool = await parseMod({ rootMod, filename: toolId + '.js', temp });

  await Promise.all([rm(tempDir, { recursive: true }), rm(filepath)]);
  return ToolDetailSchema.parse(tool);
};

export const parseUploadedTool = async (objectName: string) => {
  const privateS3Server = getPrivateS3Server();
  const toolFilename = objectName.split('/').pop();
  if (!toolFilename) return Promise.reject('Upload Tool Error: Bad objectname');

  const filepath = await privateS3Server.downloadFile({
    downloadPath: tempPkgDir,
    objectName
  });

  if (!filepath) return Promise.reject('Upload Tool Error: File not found');
  const tools = await parsePkg(filepath, true);

  await privateS3Server.removeFile(objectName);
  return tools;
};

/**
 * 从本地文件系统加载已下载的工具，注入 handler，向 PluginManager 注册。
 * 要求以下文件均已下载到本地：
 *   toolsDir/{toolId}.js
 *   toolsDir/{toolId}/manifest.yaml
 *   toolsDir/{toolId}/config.json
 */
export const LoadToolsByFilename = async (
  filename: string,
  pluginManager: PluginManager,
  serviceConfig?: Pick<ServiceConfig, 'minPods' | 'maxPods' | 'maxConcurrentRequestsPerPod'>
): Promise<ToolType | ToolSetType | null> => {
  const start = Date.now();
  const filePath = path.join(toolsDir, filename);
  const toolId = filename.replace('.js', '');
  const toolDir = path.join(toolsDir, toolId);

  // 1. 读取 manifest.yaml
  const manifest = await loadManifest(path.join(toolDir, 'manifest.yaml'));

  // 2. 读取 config.json
  const configJson = await readConfigJson(toolDir);

  // 3. 构建 rootMod
  const resolvedToolId = buildGlobalToolId(manifest.author, manifest.toolId, manifest.version);
  const rootMod = buildRootMod(manifest, configJson, resolvedToolId, filename);

  if (!rootMod.toolId) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return null;
  }

  // 4. 向 PluginManager 注册进程池（若尚未注册）；若已注册则更新配置
  if (!pluginManager.hasPlugin(resolvedToolId)) {
    await pluginManager.register(resolvedToolId, {
      type: 'tool',
      pluginPath: filePath,
      serviceConfig
    });
  } else if (serviceConfig) {
    await pluginManager.updateServiceConfig(resolvedToolId, serviceConfig).catch(() => {});
  }

  // 5. 通过 parseMod 注入 handler（IPC 调用 PluginManager）
  const result = await parseMod({ rootMod, filename, pluginManager });

  logger.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);
  return result;
};

// FastGPT@getTime@0.1.0\// FastGPT@dbops@0.1.0/mysql
export async function getTool(_toolId: string): Promise<ToolType | undefined> {
  const lastAtIndex = _toolId.lastIndexOf('@');
  const toolId = lastAtIndex > 0 ? _toolId.substring(0, lastAtIndex) : _toolId;
  const version = lastAtIndex > 0 ? _toolId.substring(lastAtIndex + 1) : undefined;
  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);
  if (toolId.includes('/')) {
    const toolset = tools.get(toolId.split('/')[0]);
    if (toolset && 'children' in toolset) {
      const child = toolset.children.find((child: ToolType) => child.toolId === toolId);
      if (child && version) {
        return {
          ...child,
          versionList: child.versionList?.filter((v) => v.value === version)
        };
      }
      return child;
    }
  }
  const tool = tools.get(toolId) as ToolType;
  if (tool && version) {
    return {
      ...tool,
      versionList: tool.versionList?.filter((v) => v.value === version)
    };
  }
  return tool;
}

export function getToolTags(): z.infer<typeof ToolTagListSchema> {
  return Object.entries(ToolTagsNameMap).map(([id, name]) => ({
    value: id as z.infer<typeof ToolTagSchema>,
    label: name.en
  }));
}

export async function downloadTool(objectName: string, uploadPath: string) {
  const filename = objectName.split('/').pop() as string;

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  const filepath = path.join(uploadPath, filename);

  try {
    const privateS3Server = getPrivateS3Server();
    await pipeline(await privateS3Server.getFile(objectName), createWriteStream(filepath)).catch(
      (err: unknown) => {
        logger.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
  } catch {
    await rm(filepath);
  }
}
