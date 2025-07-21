import type { Request, Response, NextFunction } from 'express';
import { MongoFastGPTPlugin } from '../../../src/plugin/schema';
import { addLog } from '../../../src/utils/log';
import { getErrText } from '@tool/utils/err';
import { initUploadedTool } from '@tool/init';
import path from 'path';
import type { ToolSetType } from '@tool/type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

export const uploadHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;

    addLog.info('Plugin URL received', { url });

    await MongoFastGPTPlugin.connect();

    const extractedToolId = await downloadAndInstallPlugin(url);

    const result = await MongoFastGPTPlugin.insertPluginUrl(extractedToolId, url);

    res.status(200).json({
      code: 200,
      message: 'Plugin URL processed and installed successfully',
      mongoResult: result,
      toolId: extractedToolId
    });
  } catch (error) {
    addLog.error('Plugin URL processing error:', error);
    res.status(500).json({
      code: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

async function extractToolIdFromFile(filePath: string): Promise<string | null> {
  const rootMod = (await import(filePath)).default as ToolSetType;
  return rootMod.toolId;
}

async function downloadAndInstallPlugin(url: string): Promise<string> {
  try {
    const fullUrl = buildFullUrl(url);

    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(30000)
    });

    addLog.info(`Response status: ${response.status}`);
    addLog.info(`Response statusText: ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Determine filename and path
    const filename = getFilenameFromUrl(fullUrl);
    if (!filename) {
      throw new Error('Failed to get filename from url');
    }

    const finalFilePath = path.join(process.cwd(), 'dist', 'tools', 'uploaded', filename);

    const fileStream = createWriteStream(finalFilePath);
    await pipeline(Readable.fromWeb(response.body as any), fileStream);

    const extractedToolId = await extractToolIdFromFile(finalFilePath);
    if (!extractedToolId) {
      throw new Error('Failed to extract toolId from downloaded file');
    }

    await initUploadedTool();

    return extractedToolId;
  } catch (error) {
    addLog.error(`Failed to download/install plugin:`, getErrText(error));
    throw error;
  }
}

function buildFullUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (process.env.MINIO_HOST && process.env.MINIO_PORT) {
    return `http://${process.env.MINIO_HOST}:${process.env.MINIO_PORT}/${url}`;
  } else {
    return `http://localhost:9000/${url}`;
  }
}

function getFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = path.basename(pathname);

    if (filename && !filename.endsWith('.js') && !filename.endsWith('.ts')) {
      filename += '.js';
    }

    return filename || null;
  } catch {
    return null;
  }
}
