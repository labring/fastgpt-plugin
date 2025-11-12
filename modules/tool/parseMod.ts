import { ToolTagEnum } from 'sdk/client';
import { UploadToolsS3Path } from './constants';
import type { ToolSetType, ToolType } from './type';
import { PublicBucketBaseURL } from '@/s3/const';
<<<<<<< HEAD
import { generateToolVersion, generateToolSetVersion } from './utils/tool';
=======
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)

export const getIconPath = (name: string) => `${PublicBucketBaseURL}${UploadToolsS3Path}/${name}`;

export const parseMod = async ({
  rootMod,
<<<<<<< HEAD
  filename,
  temp = false
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
  temp?: boolean;
=======
  filename
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
}) => {
  const tools: ToolType[] = [];
  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };
  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

<<<<<<< HEAD
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
=======
    const parentIcon = rootMod.icon || getIconPath(`${toolsetId}/logo`);
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)

    // push parent
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
<<<<<<< HEAD
      versionList: [],
      version: generateToolSetVersion(children) || ''
    });
=======
      versionList: []
    });

    const children = rootMod.children;

    for (const child of children) {
      const childToolId = child.toolId;

      const childIcon =
        child.icon || rootMod.icon || getIconPath(`${toolsetId}/${childToolId}/logo`);

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
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
  } else {
    // is not toolset
    const toolId = rootMod.toolId;

<<<<<<< HEAD
    const icon = rootMod.icon || getIconPath(`${temp ? 'temp/' : ''}${toolId}/logo`);
=======
    const icon = rootMod.icon || getIconPath(`${toolId}/logo`);
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon,
      toolId,
<<<<<<< HEAD
      toolFilename: filename,
      version: generateToolVersion(rootMod.versionList)
=======
      toolFilename: filename
>>>>>>> 75649c4 (feat: new tool wechat official account toolset; fix: worker)
    });
  }
  return tools;
};
