import { s } from '@/router/init';
import { contract } from '@/contract';
import { addLog } from '../../../src/utils/log';
import { getTool } from '@tool/controller';
import path from 'path';
import fs from 'fs';
import { getErrText } from '@tool/utils/err';
import { uploadedTools } from '@tool/constants';
import { PluginModel } from '@/models/plugins';
import { fileUploadS3Server } from '@/s3/config';

export const deleteToolHandler = s.route(contract.tool.delete, async ({ body }) => {
  try {
    const { toolId } = body;

    await deleteLocalFileAndRemoveFromList(toolId);

    const deletedRecord = await deleteMongoRecord(toolId);
    if (!deletedRecord) {
      return {
        status: 404,
        body: {
          code: 404,
          error: `Tool with toolId ${toolId} not found in MongoDB`
        }
      };
    }

    await deleteMinioFile(deletedRecord.objectName);

    return {
      status: 200,
      body: {
        code: 200,
        message: 'Tool deleted successfully',
        deletedRecord
      }
    };
  } catch (error) {
    addLog.error('Delete tool error:', error);
    return {
      status: 500,
      body: {
        code: 500,
        error: getErrText(error)
      }
    };
  }
});

async function deleteMongoRecord(toolId: string): Promise<any> {
  try {
    const result = await PluginModel.findOneAndDelete({ toolId });
    return result;
  } catch (error) {
    addLog.error(`Failed to delete MongoDB record for toolId ${toolId}:`, error);
    return Promise.reject(error);
  }
}

async function deleteMinioFile(url: string): Promise<void> {
  const objectName = extractObjectNameFromUrl(url);
  if (!objectName) {
    addLog.warn(`Could not extract objectName from URL: ${url}`);
    return;
  }
  await fileUploadS3Server.removeFile(objectName);
}

function extractObjectNameFromUrl(url: string): string | null {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const parts = url.split('/');
      if (parts.length >= 2) {
        const objectName = parts.slice(1).join('/');
        return objectName;
      } else {
        return url;
      }
    }

    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    const pathParts = pathname.substring(1).split('/');

    if (pathParts.length < 2) {
      addLog.warn(`Invalid URL structure: ${url}`);
      return null;
    }

    const objectName = pathParts.slice(1).join('/');
    return objectName;
  } catch (error) {
    addLog.error(`Failed to extract objectName from URL: ${url}`, error);
    return null;
  }
}

async function deleteLocalFileAndRemoveFromList(toolId: string): Promise<void> {
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
