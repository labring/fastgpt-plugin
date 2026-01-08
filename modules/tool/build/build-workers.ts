import { ensureDir } from '@/utils/fs';
import { join } from 'path';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';

export const workersSourceDir = join(__dirname, '..', 'worker');
const workersDistDir = join(__dirname, '..', '..', '..', 'dist', 'workers', 'tool');

/**
 * Scan all workers in tool/worker directory
 * Each worker is a folder with index.ts as entry point
 */
async function findWorkerFiles(): Promise<Map<string, string>> {
  const workerFiles = new Map<string, string>();

  if (!existsSync(workersSourceDir)) {
    console.log('Worker source directory not found:', workersSourceDir);
    return workerFiles;
  }

  const workers = await readdir(workersSourceDir, { withFileTypes: true });

  for (const worker of workers) {
    if (!worker.isDirectory()) continue;

    const workerPath = join(workersSourceDir, worker.name, 'index.ts');

    if (existsSync(workerPath)) {
      workerFiles.set(worker.name, workerPath);
    }
  }

  return workerFiles;
}

/**
 * Build all worker files into dist/workers
 */
export async function buildWorkers() {
  console.log('Building workers...');

  await ensureDir(workersDistDir);

  const workerFiles = await findWorkerFiles();

  if (workerFiles.size === 0) {
    console.log('No worker files found');
    return;
  }

  console.log(`Found ${workerFiles.size} worker(s): ${Array.from(workerFiles.keys()).join(', ')}`);

  // Build all workers in parallel
  const buildPromises = Array.from(workerFiles.entries()).map(async ([workerName, workerPath]) => {
    try {
      await Bun.build({
        entrypoints: [workerPath],
        outdir: workersDistDir,
        target: 'node',
        naming: `${workerName}.worker.js`,
        minify: false, // Don't minify workers for better debugging
        external: ['worker_threads'] // Don't bundle Node.js built-in modules
      });

      console.log(`✓ Built worker: ${workerName}`);
    } catch (error) {
      console.error(`✗ Failed to build worker ${workerName}:`, error);
      throw error;
    }
  });

  await Promise.all(buildPromises);

  console.log(`Successfully built ${workerFiles.size} worker(s)`);

  return workerFiles;
}

/**
 * Build a single worker file (for development)
 */
export async function buildWorker(workerName: string) {
  const workerPath = join(workersSourceDir, workerName, 'index.ts');

  if (!existsSync(workerPath)) {
    throw new Error(`Worker file not found: ${workerPath}`);
  }

  await ensureDir(workersDistDir);

  await Bun.build({
    entrypoints: [workerPath],
    outdir: workersDistDir,
    target: 'node',
    naming: `${workerName}.worker.js`,
    minify: false,
    external: ['worker_threads']
  });

  console.log(`✓ Built worker: ${workerName}`);
}
