import { basePath, UploadToolsS3Path } from '@tool/constants';
import type { ToolSetType, ToolType } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { existsSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { ToolDetailSchema } from 'sdk/client';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

const S3BasePath = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`;

const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
  const tools: ToolType[] = [];

  const toolPath = join(basePath, 'modules', 'tool', 'packages', filename);

  // get all avatars and push them into s3
  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;
  const parentIcon = rootMod.icon ?? `${S3BasePath}${UploadToolsS3Path}/${toolsetId}/logo`;

  if (isToolSet) {
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
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

        const childIcon =
          childMod.icon ??
          rootMod.icon ??
          `${S3BasePath}${UploadToolsS3Path}/${toolsetId}/${file}/logo`;
        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childIcon,
          parentId: toolsetId
        });
      }
    }

    tools.push(...children);
  } else {
    // is not toolset
    const icon = rootMod.icon ?? `${S3BasePath}${UploadToolsS3Path}/${toolsetId}/logo`;

    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
      toolFilename: filename
    });
  }

  return tools;
};

async function main() {
  console.log(
    'Building JSON data source for marketplace, please make sure you have the complete repo'
  );

  const dir = join(basePath, 'modules', 'tool', 'packages');
  const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
  const devTools = (
    await Promise.all(
      dirs.map(async (filename) => {
        return LoadToolsDev(filename);
      })
    )
  ).flat();
  const toolMap = new Map();
  for (const tool of devTools) {
    toolMap.set(tool.toolId, tool);
  }

  const toolList = Array.from(toolMap.values()).map((item) => ToolDetailSchema.parse(item));
  writeFileSync(join(basePath, 'dist', 'tools.json'), JSON.stringify(toolList));

  console.log(
    'JSON data source for marketplace has been built successfully',
    'tools:',
    toolList.length
  );

  console.log(join(basePath, 'dist', 'tools.json'));
}

if (import.meta.main) {
  await main();
}
