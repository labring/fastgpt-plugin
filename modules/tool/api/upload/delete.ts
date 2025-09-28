import { contract } from '@/contract';
import { MongoPluginModel } from '@/mongo/models/plugins';
import { mongoSessionRun } from '@/mongo/utils';
import { s } from '@/router/init';
import { pluginFileS3Server } from '@/s3';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';

export default s.route(contract.tool.upload.delete, async ({ query: { toolId: rawToolId } }) => {
  const toolId = rawToolId.split('-').slice(1).join('-');
  await mongoSessionRun(async (session) => {
    const result = await MongoPluginModel.findOneAndDelete({ toolId }).session(session);
    if (!result) {
      return {
        status: 404,
        body: {
          error: `Tool with toolId ${toolId} not found in MongoDB`
        }
      };
    }
    await pluginFileS3Server.removeFile(result.objectName);
    await refreshVersionKey(SystemCacheKeyEnum.systemTool);
  });

  return {
    status: 200,
    body: {
      message: 'Tool deleted successfully'
    }
  };
});
