import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { tempPkgDir, tempToolsDir, toolsDir, UploadToolsS3Path } from '../constants';
import {
  ToolDetailSchema,
  ToolTagEnum,
  ToolTagSchema,
  type ToolDistType,
  type ToolSetType,
  type ToolType,
  type UnifiedToolType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';
import path, { parse } from 'node:path';
import { mimeMap } from '@/lib/s3/const';
import { catchError, ToolTagsNameMap, unpkg } from '@fastgpt-plugin/helpers/index';
import { readdir, stat, rm } from 'node:fs/promises';
import { getLogger, mod } from '@/lib/logger';
import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import type z from 'zod';
import type { ToolTagListSchema } from '../schemas';
import { pipeline } from 'node:stream/promises';
import { getErrText } from '@/utils/err';

const logger = getLogger(mod.tool);

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
    `${UploadToolsS3Path}${temp ? '/temp/' : ''}/${toolId}/${filepath}`
  );
};

export const parseMod = async ({
  rootMod,
  filename,
  temp = false
}: {
  rootMod: ToolDistType;
  filename: string;
  temp?: boolean; // 临时解析
}) => {
  const checkRootModToolSet = (rootMod: ToolSetType | ToolType): rootMod is ToolSetType =>
    'children' in rootMod;

  if (checkRootModToolSet(rootMod as ToolSetType | ToolType)) {
    const toolsetId = rootMod.toolId;

    const parentIcon =
      rootMod.icon ||
      getS3ToolStaticFileURL({
        toolId: toolsetId,
        temp,
        filepath: 'logo'
      });

    const readmeUrl = getS3ToolStaticFileURL({
      toolId: toolsetId,
      temp,
      filepath: 'README.md'
    });

    const children = rootMod.children!.map<ToolType>((child) => {
      const childToolId = child.toolId;

      const childIcon =
        child.icon ||
        rootMod.icon ||
        getS3ToolStaticFileURL({
          toolId: childToolId,
          temp,
          filepath: 'logo'
        });
      return {
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        tutorialUrl: rootMod.tutorialUrl,
        readmeUrl,
        author: rootMod.author,
        icon: childIcon
      };
    });

    // 返回 ToolSetType，必须包含 children 字段
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
    // is not toolset
    const toolId = rootMod.toolId;

    const icon = rootMod.icon || getS3ToolStaticFileURL({ toolId, filepath: 'logo', temp });
    const readmeUrl = getS3ToolStaticFileURL({ toolId, filepath: 'README.md', temp });

    return {
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.tools],
      icon,
      toolId,
      filename,
      readmeUrl
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
  console.log(await readdir(tempDir));
  console.log(path.join(tempDir, 'index.js'));
  const mod = (await import(path.join(tempDir, 'index.js'))).default as ToolSetType | ToolType;
  console.log('mod');
  console.log('mod', mod);

  // upload unpkged files (except index.js) to s3
  // 1. get all files recursively
  const files = await readdir(tempDir, { recursive: true });
  const publicS3Server = getPublicS3Server();
  const privateS3Server = getPrivateS3Server();

  // 2. upload
  await Promise.all(
    files.map(async (file) => {
      const filepath = path.join(tempDir, file);
      if ((await stat(filepath)).isDirectory() || file === 'index.js') return;

      const staticFilePath = path.join(tempDir, file);
      const prefix = temp
        ? `${UploadToolsS3Path}/temp/${mod.toolId}`
        : `${UploadToolsS3Path}/${mod.toolId}`;
      await publicS3Server.uploadFileAdvanced({
        path: staticFilePath,
        defaultFilename: file.split('.').slice(0, -1).join('.'), // remove the extention name
        prefix,
        keepRawFilename: true,
        contentType: mimeMap[parse(staticFilePath).ext],
        ...(temp
          ? {
              expireMins: 60
            }
          : {})
      });
    })
  );

  // 3. upload index.js to private bucket
  await privateS3Server.uploadFileAdvanced({
    path: path.join(tempDir, 'index.js'),
    prefix: temp ? `${UploadToolsS3Path}/temp` : UploadToolsS3Path,
    defaultFilename: mod.toolId + '.js',
    keepRawFilename: true,
    ...(temp
      ? {
          expireMins: 60
        }
      : {})
  });

  const tool = await parseMod({
    rootMod: mod,
    filename: path.join(tempDir, 'index.js'),
    temp
  });

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

  // 4. remove the uploaded pkg file
  await privateS3Server.removeFile(objectName);
  return tools;
};

// Load tool or toolset and its children
export const LoadToolsByFilename = async (
  filename: string
): Promise<ToolType | ToolSetType | null> => {
  const start = Date.now();

  const filePath = path.join(toolsDir, filename);

  // Calculate file content hash for cache key
  const fileSize = await stat(filePath).then((res) => res.size);
  // This ensures same content reuses the same cached module
  const modulePath = `${filePath}?v=${fileSize}`;

  const rootMod = (await import(modulePath)).default as UnifiedToolType;

  if (!rootMod.toolId) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return null;
  }

  logger.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);

  return parseMod({ rootMod, filename });
};

export async function getTool(toolId: string): Promise<ToolType | undefined> {
  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);
  if (toolId.includes('/')) {
    const toolset = tools.get(toolId.split('/')[0]);
    if (toolset && 'children' in toolset) {
      return toolset.children.find((child) => child.toolId === toolId);
    }
  }
  return tools.get(toolId) as ToolType;
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
      (err: any) => {
        logger.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
  } catch {
    await rm(filepath);
  }
}
