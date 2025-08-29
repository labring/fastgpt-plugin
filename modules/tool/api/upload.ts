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
import * as fs from 'fs';

export const uploadToolHandler = s.route(contract.tool.upload, async ({ body }) => {
  try {
    const { url } = body;
    const extractedToolId = await downloadAndInstallPlugin(url);

    const existingPlugin = await PluginModel.findOne({ toolId: extractedToolId });
    if (existingPlugin) {
      addLog.warn(`Plugin with toolId ${extractedToolId} already exists, skipping upload`);
      return {
        status: 409,
        body: {
          error: `Plugin with toolId ${extractedToolId} already exists`
        }
      };
    }

    await PluginModel.create({
      toolId: extractedToolId,
      url,
      type: 'tool'
    });

    return {
      status: 200,
      body: {
        message: 'Plugin URL processed and installed successfully',
        toolId: extractedToolId
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

async function extractToolIdFromFile(filePath: string): Promise<string | null> {
  const rootMod = (await import(filePath)).default as ToolSetType;
  return rootMod.toolId;
}

async function downloadAndInstallPlugin(Url: string): Promise<string> {
  try {
    const fullUrl = global.pluginFileS3Server.generateAccessUrl(Url);
    console.log('fullUrl', fullUrl);
    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return Promise.reject(`Download failed: ${response.status} ${response.statusText}`);
    }

    const filename = await getFilenameFromUrl(fullUrl);
    const uploadPath = path.join(process.cwd(), 'dist', 'tools', 'uploaded');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filepath = path.join(uploadPath, filename);
    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(filepath));
    const extractedToolId = await extractToolIdFromFile(filepath);
    if (!extractedToolId) return Promise.reject('Failed to extract toolId from file');

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
