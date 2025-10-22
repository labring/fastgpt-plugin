import { isProd } from '@/constants';
import { join } from 'path';
import type { ToolSetType, ToolType } from './type';
import { ToolTypeEnum } from 'sdk/client';
import { addLog } from '@/utils/log';
import { basePath, devToolIds, toolsDir, tempToolsDir } from './constants';
import { readdir, rename, stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { ensureDir, moveDir } from '@/utils/fs';
import { move } from 'fs-extra';

/**
 * Move files from unzipped structure to dist directory
 * toolRootPath: dist/tools/[filename]
 * distAssetsDir: dist/public/fastgpt-plugins/tools/[filename]
 * move files:
 * - all logo.* including subdirs
 * - assets dir
 */
const moveAssetsFiles = async (toolRootPath: string, distAssetsPath: string) => {
  await ensureDir(distAssetsPath);
  const files = await readdir(toolRootPath);
  const logos = [];
  for (const file of files) {
    if (file.startsWith('logo.') && (await stat(join(toolRootPath, file))).isFile()) {
      logos.push(file);
      continue;
    }

    if ((await stat(join(toolRootPath, file))).isDirectory()) {
      const subFiles = await readdir(join(toolRootPath, file));
      const subLogos = await Promise.all(
        subFiles.map(async (subFile) => {
          if (
            subFile.startsWith('logo.') &&
            (await stat(join(toolRootPath, file, subFile))).isFile()
          ) {
            return join(file, subFile);
          }
          return null;
        })
      );
      logos.push(...subLogos.filter((logo): logo is string => logo !== null));
    }
  }

  // move logos
  await Promise.all(
    logos.map(async (logo) => {
      const src = join(toolRootPath, logo);
      const dest = join(distAssetsPath, logo);
      await moveDir(src, dest);
    })
  );

  // move assets dir
  if (existsSync(join(toolRootPath, 'assets'))) {
    await rename(join(toolRootPath, 'assets'), join(distAssetsPath, 'assets'));
  }

  return logos;
};

const rewriteMDImagePath = (content: string, pathPrefix: string) => {
  // 1. all relative path should concat with a pathPrefix
  // 2. all URL should not be changed.
  const regex = /(!\[.*?\]\()([^)]+)(\))/g;
  return content.replace(regex, (match, p1, p2, p3) => {
    // If the path is already an absolute URL or an absolute path, don't change it.
    if (p2.startsWith('http://') || p2.startsWith('https://') || p2.startsWith('/')) {
      return match;
    }
    // Otherwise, prepend the pathPrefix
    return p1 + pathPrefix + p2 + p3;
  });
};

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const tools: ToolType[] = [];
  const toolTempRootPath = join(tempToolsDir, filename);

  const distAssetsDir = join(basePath, 'dist', 'public', 'fastgpt-plugins', 'tools', filename);

  const toolFilePath = join(toolsDir, `${filename}.js`);
  await move(join(toolTempRootPath, 'index.js'), toolFilePath, { overwrite: true });

  const readme = join(toolTempRootPath, 'README.md');
  const readmeContent = existsSync(readme)
    ? rewriteMDImagePath(await readFile(readme, 'utf-8'), distAssetsDir)
    : undefined;

  // First, copy files from pkg structure (logos from subdirectories, README.md)
  const logos = await moveAssetsFiles(toolTempRootPath, distAssetsDir);

  const rootMod = (await import(toolTempRootPath)).default as ToolType | ToolSetType;

  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };

  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;
    if (!toolsetId) {
      addLog.error(`Can not parse toolId, filename: ${filename}`);
      return [];
    }

    const parentLogoFile = logos.find((file) => file.startsWith('logo.'));
    const parentIcon = rootMod.icon || parentLogoFile ? `${distAssetsDir}/${parentLogoFile}` : '';

    // push parent
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
      versionList: [],
      readme: readmeContent
    });

    const children = rootMod.children;

    for (const child of children) {
      const toolId = child.toolId;
      if (!toolId) {
        addLog.error(`Can not parse toolId, filename: ${filename}`);
        continue;
      }

      const childIconFile = logos.find((file) =>
        file.startsWith(child.toolId.split('/').slice(1).join('/'))
      );

      const childIcon = child.icon || childIconFile ? `${distAssetsDir}/${childIconFile}` : '';

      tools.push({
        ...child,
        toolId,
        parentId: toolsetId,
        type: rootMod.type,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: childIcon,
        toolFilename: filename
      });
    }
  } else {
    const toolId = rootMod.toolId;
    if (!toolId) {
      addLog.error(`Can not parse toolId, filename: ${filename}`);
      return [];
    }

    const icon = rootMod.icon || logos.length > 0 ? logos[0] : '';

    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.tools,
      icon,
      toolId,
      toolFilename: filename,
      readme: readmeContent
    });
  }

  return tools;
};

/**
 * Load Tools in dev mode. Only avaliable in dev mode
 * @param filename
 */
export const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
  if (isProd) {
    addLog.error('Can not load dev tool in prod mode');
    return [];
  }

  const tools: ToolType[] = [];

  const toolPath = join(basePath, 'modules', 'tool', 'packages', filename);
  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;

  if (isToolSet) {
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: rootMod.icon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: []
    });

    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);
        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;
        children.push({
          ...childMod,
          toolId,
          toolFilename: filename
        });
      }
    }

    tools.push(...children);
  } else {
    // is not toolset
    tools.push({
      ...(rootMod as ToolType),
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: rootMod.icon,
      toolFilename: filename,
      versionList: []
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));

  return tools;
};
