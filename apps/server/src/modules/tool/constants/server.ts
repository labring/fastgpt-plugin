// Server-side constants - depend on env, should not be imported in SDK bundles
import { isProd } from '@/constants';
import { env } from '@/env';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const basePath = isProd ? process.cwd() : join(process.cwd(), '..');

export const serviceRequestMaxContentLength = env.SERVICE_REQUEST_MAX_CONTENT_LENGTH * 1024 * 1024; // 10MB

export const toolPkgsDir = join(basePath, 'dist', 'pkgs', 'tool');
export const toolsDir = join(basePath, 'dist', 'tools');
export const tempDir = join(tmpdir(), 'fastgpt-plugin');
export const tempPkgDir = join(tempDir, 'pkgs');
export const tempToolsDir = join(tempDir, 'tools');

export const devToolIds: Set<string> = new Set();
