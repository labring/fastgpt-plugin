import { s } from '@/router/init';
import { contract } from '@/contract';
import { PluginModel } from '../../../src/plugin/model';
import { addLog } from '../../../src/utils/log';
import { getErrText } from '@tool/utils/err';
import { initUploadedTool } from '@tool/init';
import path from 'path';
import type { ToolSetType } from '@tool/type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

export const uploadToolHandler = s.route(contract.tool.upload, async ({ body }) => {
  try {
    const { url } = body;

    addLog.info('Plugin URL received', { url });

    const extractedToolId = await downloadAndInstallPlugin(url);

    const existingPlugin = await PluginModel.findOne({ toolId: extractedToolId });
    if (existingPlugin) {
      addLog.warn(`Plugin with toolId ${extractedToolId} already exists, skipping upload`);
      return {
        status: 409,
        body: {
          code: 409,
          error: `Plugin with toolId ${extractedToolId} already exists`
        }
      };
    }

    const result = await PluginModel.create({
      toolId: extractedToolId,
      url,
      type: 'tool'
    });

    return {
      status: 200,
      body: {
        code: 200,
        message: 'Plugin URL processed and installed successfully',
        mongoResult: result,
        toolId: extractedToolId
      }
    };
  } catch (error) {
    addLog.error('Plugin URL processing error:', error);
    return {
      status: 500,
      body: {
        code: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
});

async function extractToolIdFromFile(filePath: string): Promise<string | null> {
  const rootMod = (await import(filePath)).default as ToolSetType;
  return rootMod.toolId;
}

async function downloadAndInstallPlugin(url: string): Promise<string> {
  try {
    if (!process.env.S3_HOST || !process.env.S3_PORT) {
      return Promise.reject('Failed to build full url: S3_HOST or S3_PORT not configured');
    }

    const fullUrl = `http://${process.env.S3_HOST}:${process.env.S3_PORT}/${url}`;

    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return Promise.reject(`Download failed: ${response.status} ${response.statusText}`);
    }

    const filename = await getFilenameFromUrl(fullUrl);
    if (!filename) return Promise.reject('Failed to get filename from url');

    const finalFilePath = path.join(process.cwd(), 'dist', 'tools', 'uploaded', filename);

    const fileStream = createWriteStream(finalFilePath);
    await pipeline(Readable.fromWeb(response.body as any), fileStream);

    const extractedToolId = await extractToolIdFromFile(finalFilePath);
    if (!extractedToolId) return Promise.reject('Failed to extract toolId from downloaded file');

    await initUploadedTool();

    return extractedToolId;
  } catch (error) {
    addLog.error(`Failed to download/install plugin:`, getErrText(error));
    return Promise.reject(error);
  }
}

function getFilenameFromUrl(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = path.basename(pathname);

    if (filename && !filename.endsWith('.js') && !filename.endsWith('.ts')) {
      filename += '.js';
    }

    return Promise.resolve(filename);
  } catch {
    return Promise.reject('Failed to get filename from url');
  }
}
