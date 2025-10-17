import { isProd } from '@/constants';
import { join } from 'node:path';

export const basePath = isProd ? process.cwd() : join(process.cwd(), '..');

export const UploadToolsS3Path = 'system/tools';

export const serviceRequestMaxContentLength =
  Number(process.env.SERVICE_REQUEST_MAX_CONTENT_LENGTH || 10) * 1024 * 1024; // 10MB

export const toolPkgsDir = join(basePath, 'dist', 'pkgs', 'tool');
export const toolDir = join(basePath, 'dist', 'tools');
export const toolTempDir = join(basePath, 'dist', 'temp');
export const toolTempPkgDir = join(toolTempDir, 'pkgs');

export const devToolIds: Set<string> = new Set();
