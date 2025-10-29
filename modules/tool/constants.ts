import { isProd } from '@/constants';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const basePath = isProd ? process.cwd() : join(process.cwd(), '..');

export const UploadToolsS3Path = '/system/plugin/tools';
export const PluginBaseS3Prefix = '/system/plugin/files';

export const serviceRequestMaxContentLength =
  Number(process.env.SERVICE_REQUEST_MAX_CONTENT_LENGTH || 10) * 1024 * 1024; // 10MB

export const toolPkgsDir = join(basePath, 'dist', 'pkgs', 'tool');
export const toolsDir = join(basePath, 'dist', 'tools');
export const tempDir = join(tmpdir(), 'fastgpt-plugin');
export const tempPkgDir = join(tempDir, 'pkgs');
export const tempToolsDir = join(tempDir, 'tools');

export const devToolIds: Set<string> = new Set();
