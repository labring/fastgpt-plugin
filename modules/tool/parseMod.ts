import { ToolTagEnum } from 'sdk/client';
import { UploadToolsS3Path } from './constants';
import type { ToolSetType, ToolType } from './type';
import { PublicBucketBaseURL } from '@/s3/const';
import { generateToolVersion, generateToolSetVersion } from './utils/tool';

export const getIconPath = (name: string) => `${PublicBucketBaseURL}${UploadToolsS3Path}/${name}`;

export const parseMod = async ({
  rootMod,
  filename,
  temp = false
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
  temp?: boolean;
}) => {
  const tools: ToolType[] = [];
  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };
  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

    const parentIcon = rootMod.icon || getIconPath(`${temp ? 'temp/' : ''}${toolsetId}/logo`);

    const children = rootMod.children;

    for (const child of children) {
      const childToolId = child.toolId;

      const childIcon =
        child.icon || rootMod.icon || getIconPath(`${temp ? 'temp/' : ''}${childToolId}/logo`);

      // Generate version for child tool
      const childVersion = generateToolVersion(child.versionList);
      tools.push({
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: childIcon,
        toolFilename: filename,
        version: childVersion
      });
    }

    // push parent
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: generateToolSetVersion(children) || ''
    });
  } else {
    // is not toolset
    const toolId = rootMod.toolId;

    const icon = rootMod.icon || getIconPath(`${temp ? 'temp/' : ''}${toolId}/logo`);

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon,
      toolId,
      toolFilename: filename,
      version: generateToolVersion(rootMod.versionList)
    });
  }
  return tools;
};
