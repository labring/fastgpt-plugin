import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ensureSdkFactoryRuntimeDependency,
  ensureSdkFactoryRuntimeDependencyAtRoot,
  resolveRuntimeRoot,
  resolveSdkFactoryPackageRoot
} from './sdk-factory-runtime';

const originalNodeEnv = process.env.NODE_ENV;

async function createSdkFactoryPackage(
  packageRoot: string,
  { built = true }: { built?: boolean } = {}
): Promise<void> {
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

  if (built) {
    await mkdir(path.join(packageRoot, 'dist'), { recursive: true });
    await writeFile(path.join(packageRoot, 'dist/index.js'), 'export {};\n', 'utf-8');
  }
}

describe('sdk factory runtime dependency', () => {
  afterEach(() => {
    delete process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH;
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('creates a resolvable sdk-factory package in the runtime root node_modules', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const pluginIndexPath = path.join(tempDir, 'plugin/plugin-a/1.0.0/etag-a/index.js');
    const sdkFactoryRoot = path.join(tempDir, 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory');

    try {
      process.env.NODE_ENV = 'production';
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
      process.env.NODE_ENV = 'production';
      await createSdkFactoryPackage(sdkFactoryRoot);
      process.chdir(tempDir);

      expect(await realpath(resolveSdkFactoryPackageRoot())).toBe(await realpath(sdkFactoryRoot));
    } finally {
      process.chdir(previousCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('creates the runtime sdk package from an explicit runtime root', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const sdkFactoryRoot = path.join(tempDir, 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory');

    try {
      process.env.NODE_ENV = 'production';
      await createSdkFactoryPackage(sdkFactoryRoot);
      process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH = sdkFactoryRoot;

      await ensureSdkFactoryRuntimeDependencyAtRoot({
        runtimeRoot: tempDir
      });

      expect(
        await realpath(path.join(tempDir, 'node_modules/@fastgpt-plugin/sdk-factory'))
      ).toBe(await realpath(sdkFactoryRoot));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('resolves the built workspace sdk factory in development', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const workspaceSdkFactoryRoot = path.join(tempDir, 'sdk/factory');
    const bundledSdkFactoryRoot = path.join(
      tempDir,
      'dist/runtime-sdk/@fastgpt-plugin/sdk-factory'
    );
    const previousCwd = process.cwd();

    try {
      process.env.NODE_ENV = 'development';
      await createSdkFactoryPackage(workspaceSdkFactoryRoot);
      await createSdkFactoryPackage(bundledSdkFactoryRoot);
      process.chdir(tempDir);

      expect(await realpath(resolveSdkFactoryPackageRoot())).toBe(
        await realpath(workspaceSdkFactoryRoot)
      );
    } finally {
      process.chdir(previousCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('asks for the sdk factory build when the development artifact is missing', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sdk-factory-runtime-'));
    const workspaceSdkFactoryRoot = path.join(tempDir, 'sdk/factory');
    const previousCwd = process.cwd();

    try {
      process.env.NODE_ENV = 'development';
      await createSdkFactoryPackage(workspaceSdkFactoryRoot, { built: false });
      process.chdir(tempDir);

      expect(() => resolveSdkFactoryPackageRoot()).toThrow(
        'Run `pnpm build:sdk-factory` first.'
      );
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
