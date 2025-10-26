import { privateS3Server, publicS3Server } from '@/s3';
import { MongoS3TTL } from '@/s3/ttl/schema';
import { addLog } from '@/utils/log';
import { unpkg } from '@/utils/zip';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { tempPkgDir, tempToolsDir, toolsDir, UploadToolsS3Path } from './constants';
import type { ToolSetType, ToolType } from './type';
import { ToolTagEnum } from './type/tags';
import { ToolDetailSchema } from './type/api';

/**
 * Move files from unzipped structure to dist directory
 * toolRootPath: dist/tools/[filename]
 * distAssetsDir: dist/public/fastgpt-plugins/tools/[filename]
 * move files:
 * - all logo.* including subdirs
 * - assets dir
 */

const parseMod = async ({
  rootMod,
  staticFileObjectNames,
  filename
}: {
  rootMod: ToolSetType | ToolType;
  staticFileObjectNames: string[];
  filename: string;
}) => {
  const tools: ToolType[] = [];
  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };
  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

    const parentIconName = staticFileObjectNames.find((item) =>
      item.startsWith(`${UploadToolsS3Path}/${toolsetId}/logo.`)
    );

    const parentIcon =
      rootMod.icon ||
      (parentIconName ? await publicS3Server.generateExternalUrl(parentIconName) : '');

    // push parent
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
      versionList: []
    });

    const children = rootMod.children;

    for (const child of children) {
      const childToolId = child.toolId;
      const childIconName = staticFileObjectNames.find((item) =>
        item.startsWith(`${UploadToolsS3Path}/${toolsetId}/${childToolId}/logo.`)
      );

      const childIcon =
        child.icon ||
        (childIconName ? await publicS3Server.generateExternalUrl(childIconName) : '');

      tools.push({
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: childIcon,
        toolFilename: filename
      });
    }
  } else {
    const toolId = rootMod.toolId;

    const parentIconName = staticFileObjectNames.find((item) =>
      item.startsWith(`${UploadToolsS3Path}/${toolId}/logo.`)
    );
    const icon =
      rootMod.icon ||
      (parentIconName ? await publicS3Server.generateExternalUrl(parentIconName) : '');

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon: icon ?? '',
      toolId,
      toolFilename: filename
    });
  }
  return tools;
};

// const moveAssetsFiles = async (toolRootPath: string, distAssetsPath: string) => {
//   await ensureDir(distAssetsPath);
//   const files = await readdir(toolRootPath);
//   const logos = [];
//   for (const file of files) {
//     if (file.startsWith('logo.') && (await stat(join(toolRootPath, file))).isFile()) {
//       logos.push(file);
//       continue;
//     }

//     if ((await stat(join(toolRootPath, file))).isDirectory()) {
//       const subFiles = await readdir(join(toolRootPath, file));
//       const subLogos = await Promise.all(
//         subFiles.map(async (subFile) => {
//           if (
//             subFile.startsWith('logo.') &&
//             (await stat(join(toolRootPath, file, subFile))).isFile()
//           ) {
//             return join(file, subFile);
//           }
//           return null;
//         })
//       );
//       logos.push(...subLogos.filter((logo): logo is string => logo !== null));
//     }
//   }

//   // move logos
//   await Promise.all(
//     logos.map(async (logo) => {
//       const src = join(toolRootPath, logo);
//       const dest = join(distAssetsPath, logo);
//       await moveDir(src, dest);
//     })
//   );

//   // move assets dir
//   if (existsSync(join(toolRootPath, 'assets'))) {
//     await rename(join(toolRootPath, 'assets'), join(distAssetsPath, 'assets'));
//   }

//   return logos;
// };

// const rewriteMDImagePath = (content: string, pathPrefix: string) => {
//   // 1. all relative path should concat with a pathPrefix
//   // 2. all URL should not be changed.
//   const regex = /(!\[.*?\]\()([^)]+)(\))/g;
//   return content.replace(regex, (match, p1, p2, p3) => {
//     // If the path is already an absolute URL or an absolute path, don't change it.
//     if (p2.startsWith('http://') || p2.startsWith('https://') || p2.startsWith('/')) {
//       return match;
//     }
//     // Otherwise, prepend the pathPrefix
//     return p1 + pathPrefix + p2 + p3;
//   });
// };

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const toolTempRootPath = join(toolsDir, filename);

  const rootMod = (await import(toolTempRootPath)).default as ToolType | ToolSetType;

  if (!rootMod.toolId) {
    addLog.error(`Can not parse toolId, filename: ${filename}`);
  }

  const staticFileObjectNames = await publicS3Server.getFiles(
    `${UploadToolsS3Path}/${rootMod.toolId}`
  );

  return parseMod({ rootMod, staticFileObjectNames, filename });
};

export const parseUploadedTool = async (objectName: string) => {
  const toolFilename = objectName.split('/').pop();
  if (!toolFilename) return Promise.reject('Upload Tool Error: Bad objectname');
  const filepath = await privateS3Server.downloadFile({
    downloadPath: tempPkgDir,
    objectName: objectName
  });

  if (!filepath) return Promise.reject('Upload Tool Error: File not found');
  const tempDir = join(tempToolsDir, toolFilename);
  await unpkg(filepath, tempDir);
  const mod = (await import(join(tempDir, 'index.js'))).default as ToolSetType | ToolType;

  // upload unpkged files (except index.js) to s3
  // 1. get all files recursively
  const files = await readdir(tempDir, { recursive: true });

  const staticFileObjectNames: string[] = [];
  // 2. upload
  await Promise.all(
    files.map(async (file) => {
      const filepath = join(tempDir, file);
      if ((await stat(filepath)).isDirectory() || file === 'index.js') return;

      const path = join(tempDir, file);
      // console.log(path, file);
      const { objectName } = await publicS3Server.uploadFileAdvanced({
        path,
        defaultFilename: file,
        prefix: `${UploadToolsS3Path}/${mod.toolId}`,
        keepRawFilename: true
      });

      staticFileObjectNames.push(objectName);

      await MongoS3TTL.create({
        bucketName: publicS3Server.getBucketName(),
        expiredTime: Date.now() + 3600000, // 1 hour
        minioKey: objectName
      });
    })
  );

  // 3. upload index.js to private bucket
  {
    const { objectName } = await privateS3Server.uploadFileAdvanced({
      path: join(tempDir, 'index.js'),
      prefix: UploadToolsS3Path,
      defaultFilename: mod.toolId + '.js',
      keepRawFilename: true
    });

    await MongoS3TTL.create({
      bucketName: privateS3Server.getBucketName(),
      expiredTime: Date.now() + 3600000, // 1 hour
      minioKey: objectName
    });
  }

  // 4. remove the uploaded pkg file
  await privateS3Server.removeFile(objectName);

  const tools = await parseMod({
    rootMod: mod,
    staticFileObjectNames,
    filename: join(tempDir, 'index.js')
  });
  return tools.map((item) => ToolDetailSchema.parse(item));
  // return tools.map((item) => {
  //   const res = ToolDetailSchema.safeParse(item);
  //   console.log(res.error?.message);
  // });
};
