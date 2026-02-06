import type { WorkerEnumType } from './schemas';
import path from 'node:path';

export const getWorkerFilePath = (name: WorkerEnumType) =>
  path.join(process.cwd(), 'dist', 'workers', `${name}.js`);
