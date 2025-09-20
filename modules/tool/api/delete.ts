import { s } from '@/router/init';
import { contract } from '@/contract';
import { addLog } from '../../../src/utils/log';
import { getTool } from '@tool/controller';
import path from 'path';
import fs from 'fs';
import { uploadedTools } from '@tool/constants';
import { MongoPluginModel } from '@/mongo/models/plugins';
import { fileUploadS3Server } from '@/s3/config';
import { mongoSessionRun } from '@/mongo/utils';

export const deleteToolHandler = s.route(contract.tool.delete, async ({ body }) => {
  const { toolId } = body;

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

    await fileUploadS3Server.removeFile(result.objectName);
    await deleteLocalFileAndRemoveFromList(toolId);
  });

  return {
    status: 200,
    body: {
      message: 'Tool deleted successfully'
    }
  };
});

async function deleteLocalFileAndRemoveFromList(toolId: string) {
  try {
    const tool = getTool(toolId);
    if (!tool) {
      return Promise.reject(`Tool not found in tools list for toolId: ${toolId}`);
    }

    // Extract filename from toolDirName (format: "toolSource/filename")
    const [toolSource, filename] = tool.toolDirName.split('/');
    const pluginDir = path.join(process.cwd(), 'dist', 'tools', toolSource);
    const filePath = path.join(pluginDir, filename);

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
  } catch (error) {
    addLog.error(`Failed to delete local file and remove from list for toolId ${toolId}:`, error);
    throw error;
  }
}
