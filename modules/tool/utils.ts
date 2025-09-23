import { isProd } from '@/constants';
import path from 'path';

export const UploadedToolBaseURL = path.join(process.cwd(), 'dist', 'tools', 'uploaded');
export const BuiltInToolBaseURL = isProd
  ? path.join(process.cwd(), 'dist', 'tools', 'built-in')
  : path.join(process.cwd(), 'modules', 'tool', 'packages');
