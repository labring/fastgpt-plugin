import { publicS3Server } from '@/lib/s3';
import { UploadToolsS3Path } from '../constants';
import type {
  UnifiedToolType
} from '@fastgpt-plugin/helpers/tools/schemas/tool';

export const getIconPath = (name: string) =>
  publicS3Server.generateExternalUrl(`${UploadToolsS3Path}/${name}`);

export const parseMod = async ({
  rootMod,
  filename,
  temp = false
}: {
  rootMod: UnifiedToolType;
  filename: string;
  temp?: boolean;
}) => {
  const tools: UnifiedToolType[] = [];
  const checkRootModToolSet = (rootMod: UnifiedToolType): rootMod is  => {
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
