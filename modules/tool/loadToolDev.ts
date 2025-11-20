import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, parse } from 'path';
import { glob } from 'glob';
import { basePath, devToolIds, UploadToolsS3Path } from './constants';
import type { ToolType, ToolSetType } from './type';
import { ToolTagEnum } from './type/tags';
import { publicS3Server } from '@/s3';
import { mimeMap } from '@/s3/const';
import { generateToolVersion, generateToolSetVersion } from './utils/tool';

/**
 * Load Tools in dev mode. Only avaliable in dev mode
 * @param filename
 */
export const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
  if (isProd) {
    addLog.error('Can not load dev tool in prod mode');
    return [];
  }

  const uploadStatic =
    !global.isReboot || // do not upload while hot restart
    global.staticUploaded; // neither upload again (not hot restart, just refresh the cache)

  global.staticUploaded = true;

  const tools: ToolType[] = [];

  const toolPath = join(basePath, 'modules', 'tool', 'packages', filename);

  // get all avatars and push them into s3
  try {
    // Find logo files using glob pattern
    const logoFiles = await glob(`${toolPath}/logo.*`);
    const readmeFile = join(toolPath, 'README.md');

    // Upload logo files if found
    if (uploadStatic) {
      for (const logoPath of logoFiles) {
        try {
          const logoFilename = logoPath.split('/').pop()!;
          const logoNameWithoutExt = logoFilename.split('.').slice(0, -1).join('.');
          await publicS3Server.uploadFileAdvanced({
            path: logoPath,
            defaultFilename: logoNameWithoutExt,
            prefix: UploadToolsS3Path + '/' + filename,
            keepRawFilename: true,
            contentType: mimeMap[parse(logoPath).ext]
          });
          addLog.debug(
            `📦 Uploaded tool logo file: ${filename} -> ${UploadToolsS3Path}/${filename}/${logoNameWithoutExt}`
          );
        } catch (error) {
          addLog.warn(`Failed to upload logo file ${logoPath}: ${error}`);
        }
      }
    }

    // Upload README.md if it exists
    if (existsSync(readmeFile) && uploadStatic) {
      try {
        await publicS3Server.uploadFileAdvanced({
          path: readmeFile,
          prefix: UploadToolsS3Path + '/' + filename,
          keepRawFilename: true,
          contentType: 'text/markdown'
        });
        addLog.debug(
          `Uploaded README.md: ${readmeFile} to ${UploadToolsS3Path}/${filename}/README.md`
        );
      } catch (error) {
        addLog.warn(`Failed to upload README.md ${readmeFile}: ${error}`);
      }
    }
  } catch (error) {
    addLog.warn(`Failed to upload static files for ${filename}: ${error}`);
  }
  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;
  const parentIcon =
    rootMod.icon ??
    (await publicS3Server.generateExternalUrl(`${UploadToolsS3Path}/${toolsetId}/logo`));

  if (isToolSet) {
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);

        // Handle static files for child tools
        try {
          // Find logo files using glob pattern for child tool
          const childLogoFiles = await glob(`${childPath}/logo.*`);

          if (childLogoFiles.length > 0 && uploadStatic) {
            // Child has its own logo, upload it
            for (const logoPath of childLogoFiles) {
              try {
                const logoFilename = logoPath.split('/').pop()!;
                const logoNameWithoutExt = logoFilename.split('.').slice(0, -1).join('.');
                await publicS3Server.uploadFileAdvanced({
                  path: logoPath,
                  defaultFilename: logoNameWithoutExt,
                  prefix: UploadToolsS3Path + '/' + toolsetId + '/' + file + '/',
                  keepRawFilename: true,
                  contentType: mimeMap['.' + logoFilename.split('.').pop()!]
                });
                addLog.debug(
                  `📦 Uploaded child logo file: ${toolsetId} -> ${UploadToolsS3Path}/${toolsetId}/${file}/${logoNameWithoutExt}`
                );
              } catch (error) {
                addLog.warn(`Failed to upload child logo file ${logoPath}: ${error}`);
              }
            }
          } else {
            // Child doesn't have logo, use parent's logo
            const parentLogoFiles = await glob(`${toolPath}/logo.*`);
            if (parentLogoFiles.length > 0 && uploadStatic) {
              for (const parentLogoPath of parentLogoFiles) {
                try {
                  const logoFilename = parentLogoPath.split('/').pop()!;
                  const logoNameWithoutExt = logoFilename.split('.').slice(0, -1).join('.');
                  await publicS3Server.uploadFileAdvanced({
                    path: parentLogoPath,
                    defaultFilename: logoNameWithoutExt,
                    prefix: UploadToolsS3Path + '/' + toolsetId + '/' + file + '/',
                    keepRawFilename: true,
                    contentType: mimeMap['.' + logoFilename.split('.').pop()!]
                  });
                  addLog.debug(
                    `📦 Uploaded parent logo to child: ${toolsetId} -> ${UploadToolsS3Path}/${toolsetId}/${file}/${logoNameWithoutExt}`
                  );
                } catch (error) {
                  addLog.warn(`Failed to upload parent logo for child tool ${file}: ${error}`);
                }
              }
            }
          }
        } catch (error) {
          addLog.warn(`Failed to upload static files for child tool ${file}: ${error}`);
        }

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon =
          childMod.icon ??
          rootMod.icon ??
          (await publicS3Server.generateExternalUrl(
            `${UploadToolsS3Path}/${toolsetId}/${file}/logo`
          ));

        // Generate version for child tool
        const childVersion = childMod.versionList
          ? generateToolVersion(childMod.versionList)
          : generateToolVersion([]);

        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childIcon,
          parentId: toolsetId,
          version: childVersion
        });
      }
    }

    // Generate version for tool set based on children
    const toolSetVersion = generateToolSetVersion(children);

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: toolSetVersion ?? ''
    });

    tools.push(...children);
  } else {
    // is not toolset
    const icon =
      rootMod.icon ??
      (await publicS3Server.generateExternalUrl(`${UploadToolsS3Path}/${toolsetId}/logo`));

    // Generate version for single tool
    const toolVersion = (rootMod as any).versionList
      ? generateToolVersion((rootMod as any).versionList)
      : generateToolVersion([]);

    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
      toolFilename: filename,
      version: toolVersion
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));
  return tools;
};

declare global {
  var isReboot: boolean;
  var staticUploaded: boolean;
}
