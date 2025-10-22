import { join } from 'path';
import { s } from '@/router/init';
import { contract } from '@/contract';
import { mongoSessionRun } from '@/mongo/utils';
import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { addLog } from '@/utils/log';
import { pluginFileS3Server } from '@/s3';
import { downloadFile } from '@/utils/fs';
import { tempDir, tempPkgDir } from '@tool/constants';
import { unpkg } from '@/utils/zip';
import { exit } from 'process';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { objectName } = body;
  const toolFilename = objectName.split('/').pop();
  if (!toolFilename) return Promise.reject('Upload Tool Error: Bad objectname');

  await mongoSessionRun(async (session) => {
    const filepath = await downloadFile(objectName, tempPkgDir);
    if (!filepath) return Promise.reject('Can not download tool file');

    await unpkg(filepath, join(tempDir, toolFilename));

    const toolId = (await import(join(tempDir, toolFilename, 'index.js'))).default.toolId as
      | string
      | undefined;

    if (!toolId) return Promise.reject('Can not parse ToolId from the tool, installation failed.');

    const oldTool = await MongoPluginModel.findOneAndUpdate(
      {
        toolId,
        type: pluginTypeEnum.Enum.tool
      },
      {
        objectName
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
