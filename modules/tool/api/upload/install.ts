import { s } from '@/router/init';
import { contract } from '@/contract';
import { tempPkgDir } from '@tool/constants';
import { join } from 'path';
import { batch } from '@/utils/parallel';
import { parsePkg } from '@tool/utils';
import { writeFile } from 'fs/promises';
import { MongoSystemPlugin, pluginTypeEnum } from '@/mongo/models/plugins';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { addLog } from '@/utils/log';
import { ensureDir } from '@/utils/fs';

export default s.route(contract.tool.upload.install, async ({ body }) => {
  addLog.debug(`Installing tools: ${body.urls}`);
  await ensureDir(tempPkgDir);
  const downloadFunctions = body.urls.map((url) => async () => {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const pkgSavePath = join(tempPkgDir, url.split('/').at(-1) as string);
    // Write the buffer directly to file
    await writeFile(pkgSavePath, Buffer.from(buffer));

    const tools = await parsePkg(pkgSavePath, false);
    const tool = tools.find((item) => !item.parentId);
    return tool?.toolId;
  });

  const toolIds = (await batch(5, downloadFunctions)).filter(
    <T>(item: T): item is NonNullable<T> => !!item
  );

  const allToolsInstalled = (
    await MongoSystemPlugin.find({ type: pluginTypeEnum.enum.tool }).lean()
  ).map((tool) => tool.toolId);
  // create all that not exists
  await MongoSystemPlugin.create(
    toolIds
      .filter((toolId) => !allToolsInstalled.includes(toolId))
      .map((toolId) => ({
        toolId,
        type: pluginTypeEnum.enum.tool
      })),
    {
      ordered: true
    }
  );

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);
  addLog.debug(`Success installed tools: ${toolIds}`);

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
