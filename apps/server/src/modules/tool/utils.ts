import { catchError } from '@fastgpt-plugin/helpers/common/fn';
import { tempPkgDir, tempToolsDir, UploadToolsS3Path } from './constants';
import { unpkg } from '@fastgpt-plugin/helpers/common/zip';
import path, { parse } from 'node:path';
import { getLogger } from '@logtape/logtape';
import { readdir } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import {
  ToolDetailSchema,
  type ToolSetType,
  type ToolType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';
import { getPrivateS3Server, getPublicS3Server } from '@/lib/s3';
import { mimeMap } from '@/lib/s3/const';
import { rm } from 'node:fs/promises';
import { parseMod } from './utils/tool';

const logger = getLogger();

/**
 * Move files from unzipped structure to dist directory
 * toolRootPath: dist/tools/[filename]
 * distAssetsDir: dist/public/fastgpt-plugins/tools/[filename]
 * move files:
 * - all logo.* including subdirs
 * - assets dir
 */
export const parsePkg = async (filepath: string, temp: boolean = true) => {
  const filename = filepath.split('/').pop() as string;
  const tempDir = path.join(tempToolsDir, filename);
  const [, err] = await catchError(() => unpkg(filepath, tempDir));
  if (err) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return;
  }
  const mod = (await import(path.join(tempDir, 'index.js'))).default as ToolSetType | ToolType;

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
