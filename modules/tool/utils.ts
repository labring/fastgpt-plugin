import { isProd } from '@/constants';
import path from 'path';

export const ToolBasePath = isProd
  ? path.join(process.cwd(), 'dist', 'tools')
  : path.join(process.cwd(), 'modules', 'tool', 'packages');

export const UploadedToolBaseURL = path.join(process.cwd(), 'dist', 'tools', 'uploaded');
