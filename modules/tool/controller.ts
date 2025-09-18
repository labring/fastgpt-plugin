import { ToolTypeEnum } from './type/tool';
import { ToolTypeMap } from './type/tool';
import z from 'zod';
import { I18nStringStrictSchema } from '@/type/i18n';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { builtinTools, uploadedTools } from './constants';
import type { ToolSetType, ToolType } from './type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as fs from 'fs';
import { initUploadedTool } from '@tool/init';
import path from 'path';
import { addLog } from '@/utils/log';
import { getErrText } from './utils/err';
import { pluginFileS3Server } from '@/s3/config';

export const ToolTypeListSchema = z.array(
  z.object({
    type: z.nativeEnum(ToolTypeEnum),
    name: I18nStringStrictSchema
  })
);

export function getTool(toolId: string): ToolType | undefined {
  const tools = [...builtinTools, ...uploadedTools];
  return tools.find((tool) => tool.toolId === toolId);
}

export function getToolType(): z.infer<typeof ToolTypeListSchema> {
  return Object.entries(ToolTypeMap).map(([type, name]) => ({
    type: type as ToolTypeEnum,
    name
  }));
}

export async function refreshUploadedTools() {
  addLog.info('refreshUploadedTools');
  const existsFiles = uploadedTools.map((item) => item.toolDirName);

  const tools = await MongoPluginModel.find({
    type: pluginTypeEnum.Enum.tool
  }).lean();

  const deleteFiles = existsFiles.filter(
    (item) => !tools.find((tool) => tool.objectName.split('/')[1] === item.split('/')[1])
  );

  const newFiles = tools.filter((item) => !existsFiles.includes(item.objectName.split('/')[1]));

  // merge remove and download steps into one Promise.all
  await Promise.all([
    ...deleteFiles.map((item) => fs.promises.unlink(item)),
    ...newFiles.map((tool) => downloadTool(tool.objectName))
  ]);

  await initUploadedTool();
  return uploadedTools;
}

export async function downloadTool(objectName: string, dir: string = 'uploaded') {
  try {
    const fullUrl = pluginFileS3Server.generateAccessUrl(objectName);
    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return Promise.reject(`Download failed: ${response.status} ${response.statusText}`);
    }

    const filename = objectName.split('/')[1];
    const uploadPath = path.join(process.cwd(), 'dist', 'tools', dir);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filepath = path.join(uploadPath, filename);
    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(filepath));
    const extractedToolId = await extractToolIdFromFile(filepath);
    if (!extractedToolId) return Promise.reject('Failed to extract toolId from file');

    return extractedToolId;
  } catch (error) {
    addLog.error(`Failed to download/install plugin:`, getErrText(error));
    return Promise.reject(error);
  }
}

async function extractToolIdFromFile(filePath: string) {
  const rootMod = (await import(filePath)).default as ToolSetType;
  return rootMod.toolId;
}
