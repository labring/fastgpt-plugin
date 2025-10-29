import { contract } from '@/contract';
import { MongoPlugin } from '@/mongo/models/plugins';
import { mongoSessionRun } from '@/mongo/utils';
import { s } from '@/router/init';
import { privateS3Server, publicS3Server } from '@/s3';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { UploadToolsS3Path } from '@tool/constants';
import { addLog } from '@/utils/log';

export default s.route(contract.tool.upload.delete, async ({ query: { toolId } }) => {
  addLog.debug(`Deleting tool: ${toolId}`);
  const res = await mongoSessionRun(async (session) => {
    const result = await MongoPlugin.findOneAndDelete({ toolId }).session(session);
    if (!result || !result.toolId) {
      return {
        status: 404,
        body: {
          error: `Tool with toolId ${toolId} not found in MongoDB`
        }
      } as const;
    }

    await Promise.all([
      privateS3Server.removeFile(`${UploadToolsS3Path}/${result.toolId}.js`),
      (async () => {
        const files = await publicS3Server.getFiles(`${UploadToolsS3Path}/${result.toolId}`);
        await publicS3Server.removeFiles(files);
      })()
    ]);
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  if (res) return res;
  addLog.debug(`Deleted tool: ${toolId}`);

  return {
    status: 200,
    body: {
      message: 'Tool deleted successfully'
    }
  };
});
