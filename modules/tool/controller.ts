import { ToolTypeEnum } from './type/tool';
import { ToolTypeMap } from './type/tool';
import z from 'zod';
import { ToolTypeListSchema } from './type/api';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { builtinTools, uploadedTools } from './constants';
import type { ToolSetType, ToolType } from './type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import * as fs from 'fs';
import { initUploadedTool } from '@tool/init';
import path from 'path';
import { addLog } from '@/utils/log';
import { getErrText } from './utils/err';
import { pluginFileS3Server } from '@/s3';
import { UploadedToolBaseURL } from './utils';

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

const removeFile = async (file: string) => {
  try {
    if (fs.existsSync(file)) {
      await fs.promises.unlink(file);
    }
  } catch (err) {
    addLog.warn(` delele File Error, ${getErrText(err)} `);
  }
};

export async function refreshUploadedTools() {
  addLog.info('Refreshing uploaded tools');
  const existsFiles = uploadedTools.map((item) => item.toolDirName);

  const tools = await MongoPluginModel.find({
    type: pluginTypeEnum.Enum.tool
  }).lean();

  const deleteFiles = existsFiles.filter(
    (item) => !tools.find((tool) => tool.objectName.split('/').pop() === item.split('/').pop())
  );

  const newFiles = tools.filter((item) => !existsFiles.includes(item.objectName.split('/').pop()!));

  // merge remove and download steps into one Promise.all
  await Promise.all([
    ...deleteFiles.map((item) =>
      removeFile(path.join(UploadedToolBaseURL, item.split('/').pop()!))
    ),
    ...newFiles.map((tool) => downloadTool(tool.objectName))
  ]);

  await initUploadedTool();
  return uploadedTools;
}

export async function downloadTool(objectName: string) {
  const filename = objectName.split('/').pop() as string;
  async function extractToolIdFromFile(filePath: string) {
    const rootMod = (await import(filePath)).default as ToolSetType;
    return rootMod.toolId;
  }

  const uploadPath = path.join(process.cwd(), 'dist', 'tools', 'uploaded');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const filepath = path.join(uploadPath, filename);

  try {
    await pipeline(await pluginFileS3Server.getFile(objectName), createWriteStream(filepath)).catch(
      (err) => {
        addLog.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
    const toolId = await extractToolIdFromFile(filepath).catch((err) => {
      addLog.warn(`Can not parse the tool file: ${filepath}, ${getErrText(err)}`);
      return Promise.reject(err);
    });
    addLog.debug(`Downloaded tool: ${toolId}`);
    return toolId;
  } catch {
    await removeFile(filepath);
  }
}
