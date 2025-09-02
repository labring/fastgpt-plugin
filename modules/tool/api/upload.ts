import { s } from '@/router/init';
import { contract } from '@/contract';
import { getErrText } from '@tool/utils/err';
import { PluginModel, pluginTypeEnum } from '@/models/plugins';
import { downloadTool } from '@tool/controller';
import { addLog } from '@/utils/log';
import { flushSyncKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { pluginFileS3Server } from '@/s3/config';

export const uploadToolHandler = s.route(contract.tool.upload, async ({ body }) => {
  try {
    const { objectName } = body;
    const toolId = await downloadTool(objectName);
    const digest = await pluginFileS3Server.getDigest(objectName);

    const existingPlugin = await PluginModel.findOne({ toolId });

    if (existingPlugin) {
      addLog.warn(`Plugin with toolId ${toolId} already exists, skipping upload`);
      return {
        status: 409,
        body: {
          error: `Plugin with toolId ${toolId} already exists`
        }
      };
    }

    await PluginModel.create({
      toolId,
      objectName,
      type: pluginTypeEnum.Enum.tool,
      digest
    });

    await flushSyncKey(SystemCacheKeyEnum.systemTool);

    return {
      status: 200,
      body: {
        message: 'ok'
      }
    };
  } catch (error) {
    addLog.error('Plugin URL processing error:', error);
    return {
      status: 500,
      body: {
        error: getErrText(error)
      }
    };
  }
});
