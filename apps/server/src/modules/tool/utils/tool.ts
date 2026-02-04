import { getPublicS3Server } from '@/lib/s3';
import { UploadToolsS3Path } from '../constants';
import {
  ToolTagEnum,
  type ToolSetType,
  type ToolType,
  type UnifiedToolType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';

export const getS3ToolStaticFileURL = ({
  toolId,
  temp,
  filepath
}: {
  toolId: string;
  temp: boolean;
  filepath: string;
}) => {
  const publicS3Server = getPublicS3Server();
  return publicS3Server.generateExternalUrl(
    `${UploadToolsS3Path}${temp ? '/temp/' : ''}/${toolId}/${filepath}`
  );
};

export const parseMod = async ({
  rootMod,
  filename,
  temp = false
}: {
  rootMod: UnifiedToolType;
  filename: string;
  temp?: boolean; // 临时解析
}) => {
  const tools: UnifiedToolType[] = [];

  const checkRootModToolSet = (rootMod: ToolSetType | ToolType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };

  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

    const parentIcon =
      rootMod.icon ||
      getS3ToolStaticFileURL({
        toolId: toolsetId,
        temp,
        filepath: 'logo'
      });

    const readmeUrl = getS3ToolStaticFileURL({
      toolId: toolsetId,
      temp,
      filepath: 'README.md'
    });

    const children = rootMod.children;

    for (const child of children) {
      const childToolId = child.toolId;

      const childIcon = child.icon || rootMod.icon || getS3ToolStaticFileURL({});

      // Generate version for child tool
      tools.push({
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        tutorialUrl: rootMod.tutorialUrl,
        readmeUrl: rootMod.readmeUrl,
        author: rootMod.author,
        icon: childIcon,
        filename,
        children: []
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
      versionList: []
    });
  } else {
    // is not toolset
    const toolId = rootMod.toolId;

    const icon =
      rootMod.icon || getS3ToolStaticFileURL({ toolId: `${temp ? 'temp/' : ''}${toolId}/logo` });

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
