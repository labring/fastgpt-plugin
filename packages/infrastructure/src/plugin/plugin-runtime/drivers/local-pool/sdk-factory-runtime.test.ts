import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ensureSdkFactoryRuntimeDependency,
  resolveSdkFactoryPackageRoot
} from './sdk-factory-runtime';

describe('sdk factory runtime dependency', () => {
  it('creates a resolvable sdk-factory package near plugin index.js', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const pluginIndexPath = path.join(tempDir, 'plugin/dist/index.js');

    try {
      await ensureSdkFactoryRuntimeDependency({
        pluginIndexPath,
        searchFrom: import.meta.url
      });

      const packageJsonPath = path.join(
        tempDir,
        'plugin/node_modules/@fastgpt-plugin/sdk-factory/package.json'
      );
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as {
        name?: string;
      };

      expect(packageJson.name).toBe('@fastgpt-plugin/sdk-factory');
      expect(resolveSdkFactoryPackageRoot(import.meta.url)).toContain('sdk');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
