import { s } from '@/router/init';
import { contract } from '@/contract';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { downloadTool } from '@tool/controller';
import { addLog } from '@/utils/log';
import { refreshSyncKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { mongoSessionRun } from '@/mongo/utils';

export const uploadToolHandler = s.route(contract.tool.upload, async ({ body }) => {
  const { objectName } = body;
  const toolId = await downloadTool(objectName);

  await mongoSessionRun(async (session) => {
    const existingPlugin = await MongoPluginModel.findOne({ toolId }).session(session);

    if (existingPlugin) {
      addLog.warn(`Plugin with toolId ${toolId} already exists, skipping upload`);
      return {
        status: 409,
        body: {
          error: `Plugin with toolId ${toolId} already exists`
        }
      };
    }
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
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
