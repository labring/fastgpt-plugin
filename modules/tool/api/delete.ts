import type { Request, Response, NextFunction } from 'express';
import { MongoFastGPTPlugin } from '../../../src/plugin/schema';
import { addLog } from '../../../src/utils/log';
import { getTool } from '@tool/controller';
import { tools } from '@tool/constants';
import path from 'path';
import fs from 'fs';

export const deleteHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { toolId } = req.body;

    if (!toolId) {
      res.status(400).json({
        code: 400,
        error: 'toolId is required'
      });
      return;
    }

    await MongoFastGPTPlugin.connect();

    const deletedRecord = await deleteMongoRecord(toolId);
    if (!deletedRecord) {
      res.status(404).json({
        code: 404,
        error: `Tool with toolId ${toolId} not found in MongoDB`
      });
      return;
    }

    await deleteMinioFile(deletedRecord.url);

    await deleteLocalFileAndRemoveFromList(toolId);

    res.status(200).json({
      code: 200,
      message: 'Tool deleted successfully',
      deletedRecord
    });
  } catch (error) {
    addLog.error('Delete tool error:', error);
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

async function deleteMongoRecord(toolId: string): Promise<any> {
  try {
    const record = await MongoFastGPTPlugin.findOne({ toolId });
    if (!record) {
      addLog.warn(`No MongoDB record found for toolId: ${toolId}`);
      return null;
    }

    const result = await MongoFastGPTPlugin.deleteOne({ toolId });
    addLog.info(`MongoDB delete result for toolId ${toolId}:`, result);

    return record;
  } catch (error) {
    addLog.error(`Failed to delete MongoDB record for toolId ${toolId}:`, error);
    return Promise.reject(error);
  }
}

async function deleteMinioFile(url: string): Promise<void> {
  try {
    const objectName = extractObjectNameFromUrl(url);
    if (!objectName) {
      addLog.warn(`Could not extract objectName from URL: ${url}`);
      return;
    }
    if (global.s3Server && typeof global.s3Server.removeFile === 'function') {
      await global.s3Server.removeFile(objectName);
    } else {
      addLog.warn('S3Server not available, skipping MinIO file deletion');
    }
  } catch (error) {
    addLog.error(`Failed to delete MinIO file from URL ${url}:`, error);
  }
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

    const toolDirName = tool.toolDirName;
    const uploadedPluginDir = path.join(process.cwd(), 'dist', 'tools', 'uploaded');
    const filePath = path.join(uploadedPluginDir, toolDirName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    } else {
      addLog.warn(`Local file not found: ${filePath}`);
    }

    const initialLength = tools.length;
    const filteredTools = tools.filter((t) => t.toolId !== toolId);

    if (filteredTools.length < initialLength) {
      tools.length = 0;
      tools.push(...filteredTools);
    } else {
      addLog.warn(`Tool not found in tools list for removal: ${toolId}`);
    }
  } catch (error) {
    addLog.error(`Failed to delete local file and remove from list for toolId ${toolId}:`, error);
    throw error;
  }
}
