import { ToolTagEnum } from 'sdk/client';
import { UploadToolsS3Path } from './constants';
import type { ToolSetType, ToolType } from './type';
import { PublicBucketBaseURL } from '@/s3/const';

export const getIconPath = (name: string) => `${PublicBucketBaseURL}${UploadToolsS3Path}/${name}`;

export const parseMod = async ({
  rootMod,
  filename
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
}) => {
  const tools: ToolType[] = [];
  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };
  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

    const parentIcon = rootMod.icon || getIconPath(`${toolsetId}/logo`);

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

      const childIcon = child.icon || rootMod.icon || getIconPath(`${childToolId}/logo`);

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
    // is not toolset
    const toolId = rootMod.toolId;

    const icon = rootMod.icon || getIconPath(`${toolId}/logo`);

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon,
      toolId,
      toolFilename: filename
    });
  }
  return tools;
};
