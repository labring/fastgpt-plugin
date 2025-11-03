import { s } from '@/router/init';
import { contract } from '@/contract';
import { UploadToolsS3Path } from '@tool/constants';
import { MongoPlugin, pluginTypeEnum } from '@/mongo/models/plugins';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { mongoSessionRun } from '@/mongo/utils';
import { addLog } from '@/utils/log';
import { privateS3Server, publicS3Server } from '@/s3';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { toolIds: _toolIds } = body;
  const toolIds = [...new Set(_toolIds)];
  addLog.debug(`Confirming uploaded tools: ${toolIds}`);
  const pendingTools = await privateS3Server.getFiles(`${UploadToolsS3Path}/temp`);
  const pendingToolIds = pendingTools
    .map((item) => item.split('/').at(-1)?.split('.').at(0))
    .filter((item): item is string => !!item);

  if (pendingToolIds.some((item) => !toolIds.includes(item))) {
    return {
      status: 400,
      body: {
        message: 'Some toolIds are invalid'
      }
    };
  }

  await mongoSessionRun(async (session) => {
    const allToolsInstalled = (
      await MongoPlugin.find({ type: pluginTypeEnum.enum.tool }).lean()
    ).map((tool) => tool.toolId);
    // create all that not exists
    await MongoPlugin.create(
      toolIds
        .filter((toolId) => !allToolsInstalled.includes(toolId))
        .map((toolId) => ({
          toolId,
          type: pluginTypeEnum.enum.tool
        })),
      {
        session,
        ordered: true
      }
    );

    // object move
    for await (const toolId of toolIds) {
      if (toolId) {
        await publicS3Server.moveFiles(
          `${UploadToolsS3Path}/temp/${toolId}`,
          `${UploadToolsS3Path}/${toolId}`
        );
        await privateS3Server.moveFile(
          `${UploadToolsS3Path}/temp/${toolId}.js`,
          `${UploadToolsS3Path}/${toolId}.js`
        );
      }
    }
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  addLog.debug(`Confirmed uploaded tools: ${toolIds}`);

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
