import { s } from '@/router/init';
import { contract } from '@/contract';
import { mongoSessionRun } from '@/mongo/utils';
import { downloadTool } from '@tool/controller';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { refreshSyncKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { addLog } from '@/utils/log';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { objectName } = body;

  await mongoSessionRun(async (session) => {
    const toolId = await downloadTool(objectName);
    await MongoPluginModel.updateOne(
      {
        toolId
      },
      {
        $set: {
          objectName,
          type: pluginTypeEnum.Enum.tool
        }
      },
      {
        session,
        upsert: true
      }
    );
    await refreshSyncKey(SystemCacheKeyEnum.systemTool);
    addLog.info(`Upload tool success: ${toolId}`);
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
