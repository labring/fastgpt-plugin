import { contract } from '@/contract';
import { MongoPluginModel } from '@/mongo/models/plugins';
import { mongoSessionRun } from '@/mongo/utils';
import { s } from '@/router/init';
import { getTool } from '@tool/controller';
import path from 'path';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { uploadedTools } from '@tool/constants';
import { pluginFileS3Server } from '@/s3';
import { refreshSyncKey } from '@/cache';
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
    await deleteLocalFileAndRemoveFromList(toolId);
    await refreshSyncKey(SystemCacheKeyEnum.systemTool);
  });

  return {
    status: 200,
    body: {
      message: 'Tool deleted successfully'
    }
  };
});

async function deleteLocalFileAndRemoveFromList(toolId: string) {
  const tool = getTool(toolId);
  if (!tool) {
    return Promise.reject(`Tool not found in tools list for toolId: ${toolId}`);
  }

  // Extract filename from toolDirName (format: "toolSource/filename")
  const filePath = path.join(
    process.cwd(),
    'dist',
    'tools',
    'uploaded',
    tool.toolDirName.split('/').pop()!
  );

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  } else {
    addLog.warn(`Local file not found: ${filePath}`);
  }

  const initialLength = uploadedTools.length;
  const filteredTools = uploadedTools.filter((t) => t.toolId !== toolId);

  if (filteredTools.length < initialLength) {
    uploadedTools.length = 0;
    uploadedTools.push(...filteredTools);
  } else {
    addLog.warn(`Tool not found in tools list for removal: ${toolId}`);
  }
}
