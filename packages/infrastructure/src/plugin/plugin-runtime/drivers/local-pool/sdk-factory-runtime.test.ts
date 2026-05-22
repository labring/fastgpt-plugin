import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ensureSdkFactoryRuntimeDependency,
  resolveRuntimeRoot,
  resolveSdkFactoryPackageRoot
} from './sdk-factory-runtime';

async function createSdkFactoryPackage(packageRoot: string): Promise<void> {
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({
      name: '@fastgpt-plugin/sdk-factory',
      exports: {
        '.': './dist/index.js'
      }
    }),
    'utf-8'
  );
}

describe('sdk factory runtime dependency', () => {
  afterEach(() => {
    delete process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH;
  });

  it('creates a resolvable sdk-factory package in the runtime root node_modules', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const pluginIndexPath = path.join(tempDir, 'plugin/plugin-a/1.0.0/etag-a/index.js');
    const sdkFactoryRoot = path.join(tempDir, 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory');

    try {
      await createSdkFactoryPackage(sdkFactoryRoot);
      process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH = sdkFactoryRoot;

      await ensureSdkFactoryRuntimeDependency({
        pluginIndexPath
      });

      const packageJsonPath = path.join(
        tempDir,
        'node_modules/@fastgpt-plugin/sdk-factory/package.json'
      );
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as {
        name?: string;
      };

      expect(packageJson.name).toBe('@fastgpt-plugin/sdk-factory');
      expect(resolveRuntimeRoot(pluginIndexPath)).toBe(tempDir);
      expect(await realpath(resolveSdkFactoryPackageRoot())).toBe(await realpath(sdkFactoryRoot));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('resolves the bundled runtime sdk package from the server dist tree', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const sdkFactoryRoot = path.join(tempDir, 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory');
    const previousCwd = process.cwd();

    try {
      await createSdkFactoryPackage(sdkFactoryRoot);
      process.chdir(tempDir);

      expect(await realpath(resolveSdkFactoryPackageRoot())).toBe(await realpath(sdkFactoryRoot));
    } finally {
      process.chdir(previousCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('falls back to the plugin index directory when the plugin root marker is absent', () => {
    const pluginIndexPath = path.join('/tmp/plugin-a/1.0.0/etag-a/index.js');

    expect(resolveRuntimeRoot(pluginIndexPath)).toBe(path.dirname(pluginIndexPath));
  });
});
