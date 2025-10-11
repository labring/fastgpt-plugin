import { isProd } from '@/constants';
import { join } from 'path';
export const basePath = isProd ? process.cwd() : join(process.cwd(), '..', '..');
