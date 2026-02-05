import { getPublicS3Server } from '@/lib/s3';
import { UploadToolsS3Path } from '../constants';
import {
  ToolTagEnum,
  type ToolDistType,
  type ToolSetType,
  type ToolType
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
  rootMod: ToolDistType;
  filename: string;
  temp?: boolean; // 临时解析
}) => {
  const checkRootModToolSet = (rootMod: ToolSetType | ToolType): rootMod is ToolSetType =>
    'children' in rootMod;

  if (checkRootModToolSet(rootMod as ToolSetType | ToolType)) {
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

    const children = rootMod.children!.map<ToolType>((child) => {
      const childToolId = child.toolId;

      const childIcon =
        child.icon ||
        rootMod.icon ||
        getS3ToolStaticFileURL({
          toolId: childToolId,
          temp,
          filepath: 'logo'
        });
      return {
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        tutorialUrl: rootMod.tutorialUrl,
        readmeUrl,
        author: rootMod.author,
        icon: childIcon
      };
    });

    // 返回 ToolSetType，必须包含 children 字段
    return {
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      filename,
      readmeUrl,
      children
    } as ToolSetType;
  } else {
    // is not toolset
    const toolId = rootMod.toolId;

    const icon = rootMod.icon || getS3ToolStaticFileURL({ toolId, filepath: 'logo', temp });
    const readmeUrl = getS3ToolStaticFileURL({ toolId, filepath: 'README.md', temp });

    return {
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon,
      toolId,
      filename,
      readmeUrl
    } as ToolType;
  }
};
