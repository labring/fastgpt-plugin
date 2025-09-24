import { s } from '@/router/init';
import { contract } from '@/contract';
import { mongoSessionRun } from '@/mongo/utils';
import { downloadTool } from '@tool/controller';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { addLog } from '@/utils/log';
import { pluginFileS3Server } from '@/s3';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { objectName } = body;

  await mongoSessionRun(async (session) => {
    const toolId = await downloadTool(objectName);
    if (!toolId) return Promise.reject('Can not parse ToolId from the tool, installation failed.');
    const oldTool = await MongoPluginModel.findOneAndUpdate(
      {
        toolId
      },
      {
        objectName,
        type: pluginTypeEnum.Enum.tool
      },
      {
        session,
        upsert: true
      }
    );
    if (oldTool?.objectName) pluginFileS3Server.removeFile(oldTool.objectName);
    await refreshVersionKey(SystemCacheKeyEnum.systemTool);
    addLog.info(`Upload tool success: ${toolId}`);
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
