import { s } from '@/router/init';
import { contract } from '@/contract';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { downloadTool } from '@tool/controller';
import { refreshSyncKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { mongoSessionRun } from '@/mongo/utils';
import { addLog } from '@/utils/log';

export const uploadToolHandler = s.route(contract.tool.upload, async ({ body }) => {
  const { objectName } = body;

  await mongoSessionRun(async (session) => {
    const toolId = await downloadTool(objectName);
    await MongoPluginModel.create(
      {
        toolId,
        objectName,
        type: pluginTypeEnum.Enum.tool
      },
      {
        session
      }
    );

    await refreshSyncKey(SystemCacheKeyEnum.systemTool);
    addLog.info(` Upload tool success: ${toolId}`);
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
