import packageJson from '../package.json' assert { type: 'json' };
import path from 'node:path';

export const CLI_NAME = packageJson.name;
export const CLI_VERSION = packageJson.version;

export const DEFAULT_PLUGIN_NAME = './packages/my-tool';
export const DEFAULT_PLUGIN_DESCRIPTION = 'This is a FastGPT plugin';

export const TOOL_TEMPLATES_DIR = path.join(import.meta.dirname, '../templates');
