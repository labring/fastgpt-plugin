import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tempRoots: string[] = [];

describe('LocalFileStorageRepo permissions', () => {
  afterEach(async () => {
    vi.doUnmock('@infrastructure/env');
    vi.resetModules();
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('creates private cache directories and files', async () => {
    const previousUmask = process.umask(0o022);
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'fastgpt-plugin-storage-'));
    const basePath = path.join(tempRoot, 'cache');
    tempRoots.push(tempRoot);
    vi.doMock('@infrastructure/env', () => ({
      env: {
        LOCAL_FILE_BASE_PATH: basePath
      }
    }));

    try {
      const { LocalFileStorageRepo } = await import('./local-file-storage.repo');
      const repo = LocalFileStorageRepo.getInstance();
      await repo.initialize();

      const fileKey = path.join('plugin', 'weather', '1.0.0', 'etag', 'index.js');
      const [file, error] = await repo.save({
        file: Buffer.from('export default {}'),
        fileKey,
        fileName: 'index.js'
      });

      expect(error).toBeNull();
      expect(file).toBeDefined();
      await expectMode(basePath, 0o700);
      await expectMode(path.dirname(path.join(basePath, fileKey)), 0o700);
      await expectMode(path.join(basePath, fileKey), 0o600);
      await expectMode(`${path.join(basePath, fileKey)}.meta.json`, 0o600);

      await rm(`${path.join(basePath, fileKey)}.meta.json`);
      const [legacyMeta, legacyError] = await repo.getInfo(fileKey);
      expect(legacyError).toBeNull();
      expect(legacyMeta).toMatchObject({
        fileKey,
        size: Buffer.byteLength('export default {}')
      });
    } finally {
      process.umask(previousUmask);
    }
  });
});

async function expectMode(targetPath: string, expectedMode: number): Promise<void> {
  const fileStat = await stat(targetPath);
  expect(fileStat.mode & 0o777).toBe(expectedMode);
}
