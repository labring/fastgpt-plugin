import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { basePath, devToolIds } from '@tool/constants';
import { LoadToolsByFilename } from '@tool/loadToolProd';
import { getIconPath } from '@tool/parseMod';
import type { ToolSetType, ToolType } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
<<<<<<< HEAD
import { generateToolVersion, generateToolSetVersion } from '@tool/utils/tool';
=======
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)

const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
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
  const parentIcon = rootMod.icon ?? getIconPath(`${toolsetId}/logo`);

  if (isToolSet) {
<<<<<<< HEAD
=======
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: []
    });

>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon = childMod.icon ?? rootMod.icon ?? getIconPath(`${toolsetId}/${file}/logo`);
<<<<<<< HEAD

        // Generate version for child tool
        const childVersion = childMod.versionList
          ? generateToolVersion(childMod.versionList)
          : generateToolVersion([]);

=======
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childIcon,
<<<<<<< HEAD
          parentId: toolsetId,
          version: childVersion
=======
          parentId: toolsetId
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
        });
      }
    }

<<<<<<< HEAD
    // Generate version for tool set based on children
    const toolSetVersion = generateToolSetVersion(children) ?? '';

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: toolSetVersion
    });

=======
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
    tools.push(...children);
  } else {
    // is not toolset
    const icon = rootMod.icon ?? getIconPath(`${toolsetId}/logo`);

<<<<<<< HEAD
    // Generate version for single tool
    const toolVersion = (rootMod as any).versionList
      ? generateToolVersion((rootMod as any).versionList)
      : generateToolVersion([]);

=======
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
<<<<<<< HEAD
      toolFilename: filename,
      version: toolVersion
=======
      toolFilename: filename
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));
  return tools;
};

export const loadTool = async (filename: string, dev: boolean) => {
  return dev ? await LoadToolsDev(filename) : await LoadToolsByFilename(filename);
};
