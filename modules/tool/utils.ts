import { privateS3Server, publicS3Server } from '@/s3';
import { addLog } from '@/utils/log';
import { unpkg } from '@/utils/zip';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';
import { tempPkgDir, tempToolsDir, UploadToolsS3Path } from './constants';
import type { ToolSetType, ToolType } from './type';
import { ToolDetailSchema } from './type/api';
import { catchError } from '@/utils/catch';
import { mimeMap } from '@/s3/const';
import { rm } from 'fs/promises';
import { parseMod } from './parseMod';

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
  const tempDir = join(tempToolsDir, filename);
  const [, err] = await catchError(() => unpkg(filepath, tempDir));
  if (err) {
    addLog.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }
  const mod = (await import(join(tempDir, 'index.js'))).default as ToolSetType | ToolType;

  // upload unpkged files (except index.js) to s3
  // 1. get all files recursively
  const files = await readdir(tempDir, { recursive: true });

  // 2. upload
  await Promise.all(
    files.map(async (file) => {
      const filepath = join(tempDir, file);
      if ((await stat(filepath)).isDirectory() || file === 'index.js') return;

      const path = join(tempDir, file);
      const prefix = temp
        ? `${UploadToolsS3Path}/temp/${mod.toolId}`
        : `${UploadToolsS3Path}/${mod.toolId}`;
      await publicS3Server.uploadFileAdvanced({
        path,
        defaultFilename: file.split('.').slice(0, -1).join('.'), // remove the extention name
        prefix,
        keepRawFilename: true,
        contentType: mimeMap[parse(path).ext],
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
    path: join(tempDir, 'index.js'),
    prefix: temp ? `${UploadToolsS3Path}/temp` : UploadToolsS3Path,
    defaultFilename: mod.toolId + '.js',
    keepRawFilename: true,
    ...(temp
      ? {
          expireMins: 60
        }
      : {})
  });

  const tools = await parseMod({
    rootMod: mod,
    filename: join(tempDir, 'index.js'),
    temp
  });

  await Promise.all([rm(tempDir, { recursive: true }), rm(filepath)]);
  return tools.map((item) => ToolDetailSchema.parse(item));
};

export const parseUploadedTool = async (objectName: string) => {
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
