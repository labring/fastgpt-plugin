import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path, { parse } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { catchError, ToolTagsNameMap, unpkg } from '@fastgpt-plugin/helpers/index';
import { loadManifest } from '@fastgpt-plugin/helpers/tools/helper';
import type { ToolHandlerReturnType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import {
  buildGlobalToolId,
  ToolTagEnum,
  ToolTagSchema
} from '@fastgpt-plugin/helpers/tools/schemas/tool';
import type z from 'zod';

import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { getLogger, mod } from '@/lib/logger';
import type { PluginManager } from '@/lib/plugin_manager';
import type { InvokeOptions, ServiceConfig } from '@/lib/process_pool/types';
import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { mimeMap } from '@/lib/s3/const';
import { getErrText } from '@/utils/err';

import { tempPkgDir, tempToolsDir, toolsDir, UploadToolsS3Path } from '../constants';
import type { ToolTagListSchema } from '../schemas';

const logger = getLogger(mod.tool);

/**
 * 从全局 toolId（author@name@version@etag）中提取基础 toolId（author@name）。
 * 兼容旧三段格式（author@name@version）。
 */
export function getBaseToolId(globalToolId: string): string {
  const parts = globalToolId.split('@');
  if (parts.length >= 2) return `${parts[0]}@${parts[1]}`;
  return globalToolId;
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
) {
  if (manifest.children && Object.keys(manifest.children).length > 0) {
    // 工具集：各子工具的 schema 和元数据都放入父级 versionList.children
    const versionChildren = Object.entries(manifest.children).map(([childName, childConfig]) => {
      const childEntry = configJson[childName] as
        | { inputSchema: unknown; outputSchema: unknown }
        | undefined;
      return {
        toolId: childName,
        name: childConfig.name,
        description: childConfig.description,
        icon: childConfig.icon,
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
          // 工具集的 secretSchema 在顶层，所有子工具共享
          secretSchema: (configJson as { secretSchema?: unknown }).secretSchema,
          children: versionChildren
        }
      ],
      children
    };
  }

  const schemas = configJson as {
    inputSchema?: unknown;
    outputSchema?: unknown;
    secretSchema?: unknown;
  };
  return {
    ...manifest,
    toolId,
    handler: null as never,
    versionList: [
      {
        value: manifest.version,
        description: manifest.versionDescription?.en,
        inputSchema: schemas.inputSchema,
        outputSchema: schemas.outputSchema,
        secretSchema: schemas.secretSchema
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
                ctx: {
                  systemVar: Record<string, unknown>;
                  secret?: Record<string, string>;
                  [key: string]: unknown;
                }
              ) =>
                pluginManager.invoke(
                  toolsetId,
                  'execute',
                  {
                    toolName: childName,
                    inputs,
                    systemVar: ctx.systemVar,
                    secrets: ctx.secret
                  },
                  {
                    callbackHandler: ctx.callbackHandler as InvokeOptions['callbackHandler']
                  }
                ) as Promise<ToolHandlerReturnType>
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
              ctx: {
                systemVar: Record<string, unknown>;
                secret?: Record<string, string>;
                [key: string]: unknown;
              }
            ) =>
              pluginManager.invoke(
                toolId,
                'execute',
                {
                  inputs,
                  systemVar: ctx.systemVar,
                  secrets: ctx.secret
                },
                {
                  callbackHandler: ctx.callbackHandler as InvokeOptions['callbackHandler']
                }
              ) as Promise<ToolHandlerReturnType>
          }
        : {})
    } as ToolType;
  }
};

export const parsePkg = async (filepath: string, temp: boolean = true) => {
  const filename = filepath.split('/').pop() as string;
  const tempDir = path.join(tempToolsDir, filename);

  // 计算 etag：对 .pkg 文件做 SHA256，取前 12 位 hex
  const pkgBuffer = await readFile(filepath);
  const etag = createHash('sha256').update(pkgBuffer).digest('hex').slice(0, 12);

  const [, err] = await catchError(() => unpkg(filepath, tempDir));
  if (err) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return;
  }

  // 1. 读取 manifest.yaml
  const manifestPath = path.join(tempDir, 'manifest.yaml');
  const manifest = await loadManifest(manifestPath);
  const toolId = buildGlobalToolId(manifest.author, manifest.toolId, manifest.version, etag);

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
 *
 * @param filename - 工具文件名（author@toolId@version@etag.js）
 * @param pluginManager - 插件管理器实例
 * @param toolEntry - 从数据库读取的工具元数据（包含 versionList）
 * @param serviceConfig - 进程池配置
 */
export const LoadToolsByFilename = async (
  filename: string,
  pluginManager: PluginManager,
  toolEntry: {
    type: string;
    source: string;
    author: string;
    toolId: string;
    name: any;
    description?: any;
    toolDescription: string;
    icon?: string;
    tags?: string[];
    tutorialUrl?: string;
    readmeUrl?: string;
    versionList: Array<{
      version: string;
      etag: string;
      versionDescription?: any;
      inputSchema?: any;
      outputSchema?: any;
      secretSchema?: any;
      children?: Array<{
        toolId: string;
        name: any;
        description?: any;
        icon?: string;
        inputSchema?: any;
        outputSchema?: any;
      }>;
    }>;
  },
  serviceConfig?: Pick<ServiceConfig, 'minPods' | 'maxPods' | 'maxConcurrentRequestsPerPod'>
): Promise<ToolType | ToolSetType | null> => {
  const start = Date.now();
  const filePath = path.join(toolsDir, filename);
  const globalToolId = filename.replace('.js', '');

  // 1. 从 toolEntry 中提取最新版本的元数据
  const latestVersion = toolEntry.versionList[toolEntry.versionList.length - 1];

  // 2. 构建 rootMod（从数据库元数据）
  const rootMod: ToolDistType = latestVersion.children
    ? // 工具集
      ({
        type: 'tool',
        toolId: globalToolId,
        author: toolEntry.author,
        name: toolEntry.name,
        description: toolEntry.description,
        toolDescription: toolEntry.toolDescription,
        icon: toolEntry.icon,
        tags: toolEntry.tags,
        tutorialUrl: toolEntry.tutorialUrl,
        version: latestVersion.version,
        versionList: [
          {
            value: latestVersion.version,
            etag: latestVersion.etag,
            description: latestVersion.versionDescription?.en,
            secretSchema: latestVersion.secretSchema,
            children: latestVersion.children?.map((c) => ({
              toolId: c.toolId,
              name: c.name,
              description: c.description,
              icon: c.icon,
              inputSchema: c.inputSchema,
              outputSchema: c.outputSchema
            }))
          }
        ],
        children: latestVersion.children?.map((c) => ({
          toolId: `${globalToolId}/${c.toolId}`,
          name: c.name,
          description: c.description,
          toolDescription: c.description?.en ?? '',
          icon: c.icon,
          tags: toolEntry.tags,
          filename,
          handler: null as never
        })),
        handler: null as never,
        filename
      } as unknown as ToolDistType)
    : // 单工具
      ({
        type: 'tool',
        toolId: globalToolId,
        author: toolEntry.author,
        name: toolEntry.name,
        description: toolEntry.description,
        toolDescription: toolEntry.toolDescription,
        icon: toolEntry.icon,
        tags: toolEntry.tags,
        tutorialUrl: toolEntry.tutorialUrl,
        version: latestVersion.version,
        versionList: [
          {
            value: latestVersion.version,
            etag: latestVersion.etag,
            description: latestVersion.versionDescription?.en,
            inputSchema: latestVersion.inputSchema,
            outputSchema: latestVersion.outputSchema,
            secretSchema: latestVersion.secretSchema
          }
        ],
        handler: null as never,
        filename
      } as unknown as ToolDistType);

  if (!rootMod.toolId) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return null;
  }

  // 3. 向 PluginManager 注册进程池（若尚未注册）；若已注册则更新配置
  if (!pluginManager.hasPlugin(globalToolId)) {
    await pluginManager.register(globalToolId, {
      type: 'tool',
      pluginPath: filePath,
      serviceConfig
    });
  } else if (serviceConfig) {
    await pluginManager.updateServiceConfig(globalToolId, serviceConfig).catch(() => {});
  }

  // 4. 通过 parseMod 注入 handler（IPC 调用 PluginManager）
  const result = await parseMod({ rootMod, filename, pluginManager });

  logger.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);
  return result;
};

export async function getTool(_toolId: string, _version?: string): Promise<any> {
  // 分离子工具后缀：author@name@version/childName 或 author@name/childName
  const slashIdx = _toolId.indexOf('/');
  const parentPart = slashIdx > 0 ? _toolId.substring(0, slashIdx) : _toolId;
  const childName = slashIdx > 0 ? _toolId.substring(slashIdx + 1) : undefined;

  // baseToolId = 前两段（author@name）
  const atParts = parentPart.split('@');
  const baseToolId = `${atParts[0]}@${atParts[1]}`;
  const versionId = atParts[2] ?? _version;

  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);

  if (childName) {
    const toolset = tools.get(baseToolId);
    if (toolset) {
      const fullChildId = `${baseToolId}/${childName}`;
      const version = versionId
        ? toolset.versionList?.find((v) => v.version === versionId)
        : toolset.versionList.at(-1);
      const child = version?.children?.find((child) => child.id === fullChildId);

      if (!child) return undefined;

      // 构建完整的工具对象
      return {
        toolId: child.id,
        name: child.name,
        description: child.description ?? { en: '' },
        toolDescription: child.description?.en ?? '',
        icon: child.icon ?? '',
        tags: toolset.tags,
        versionList: [
          {
            version: version!.version,
            etag: version!.etag,
            versionDescription: version!.versionDescription,
            inputSchema: child.inputSchema,
            outputSchema: child.outputSchema,
            secretSchema: version!.secretSchema
          }
        ],
        handler: null as any,
        filename: toolset.filename,
        author: toolset.author,
        tutorialUrl: toolset.tutorialUrl,
        readmeUrl: toolset.readmeUrl
      };
    }
    return undefined;
  }

  const tool = tools.get(baseToolId);
  if (!tool) return undefined;

  // 如果指定了 version，过滤 versionList
  if (_version) {
    const filtered = tool.versionList?.filter((v) => v.version === _version);
    if (!filtered?.length) return undefined;
    return { ...tool, versionList: filtered };
  }

  return tool;
}

export function getToolTags(): z.infer<typeof ToolTagListSchema> {
  return Object.entries(ToolTagsNameMap).map(([id, name]) => ({
    label: name,
    value: id as z.infer<typeof ToolTagSchema>
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
