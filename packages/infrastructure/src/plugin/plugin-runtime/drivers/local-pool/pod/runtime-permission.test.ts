import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tempRoots: string[] = [];
const originalSdkFactoryPath = process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH;

describe.skipIf(process.platform === 'win32')('PluginPod runtime dependency permissions', () => {
  afterEach(async () => {
    if (originalSdkFactoryPath === undefined) {
      delete process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH;
    } else {
      process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH = originalSdkFactoryPath;
    }
    vi.doUnmock('@infrastructure/env');
    vi.resetModules();
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('loads a symlinked runtime SDK and its dependency under the permission model', async () => {
    const tempRoot = await realpath(
      await mkdtemp(path.join(os.tmpdir(), 'fastgpt-plugin-pod-runtime-'))
    );
    const cacheRoot = path.join(tempRoot, 'cache');
    const configuredCacheRoot = path.join(os.tmpdir(), path.basename(tempRoot), 'cache');
    const sdkRoot = path.join(tempRoot, 'sdk-factory');
    const sdkNodeModules = path.join(sdkRoot, 'node_modules');
    const dependencyRoot = path.join(tempRoot, 'node_modules', 'runtime-dependency');
    const sharedRuntimeModulePath = path.join(
      cacheRoot,
      'node_modules',
      'host-sibling',
      'runtime-value.txt'
    );
    const pluginRoot = path.join(cacheRoot, 'plugin', 'permission-test', '1.0.0', 'etag');
    const pluginPath = path.join(pluginRoot, 'index.js');
    tempRoots.push(tempRoot);

    await Promise.all([
      mkdir(path.join(sdkRoot, 'dist'), { recursive: true }),
      mkdir(sdkNodeModules, { recursive: true }),
      mkdir(dependencyRoot, { recursive: true }),
      mkdir(path.dirname(sharedRuntimeModulePath), { recursive: true }),
      mkdir(pluginRoot, { recursive: true })
    ]);
    await Promise.all([
      writeFile(
        path.join(sdkRoot, 'package.json'),
        JSON.stringify({
          name: '@fastgpt-plugin/sdk-factory',
          type: 'module',
          exports: './dist/index.js',
          dependencies: {
            'runtime-dependency': '1.0.0'
          }
        })
      ),
      writeFile(
        path.join(dependencyRoot, 'package.json'),
        JSON.stringify({
          name: 'runtime-dependency',
          version: '1.0.0',
          type: 'module',
          exports: './index.js'
        })
      ),
      writeFile(path.join(dependencyRoot, 'index.js'), "export const value = 'runtime-loaded';\n"),
      writeFile(sharedRuntimeModulePath, 'runtime modules are readable'),
      writeFile(
        path.join(sdkRoot, 'dist', 'index.js'),
        "export { value as runtimeValue } from 'runtime-dependency';\n"
      ),
      writeFile(
        pluginPath,
        [
          "import { runtimeValue } from '@fastgpt-plugin/sdk-factory';",
          "import { readFileSync } from 'node:fs';",
          "if (runtimeValue !== 'runtime-loaded') throw new Error('Runtime SDK failed to load');",
          `if (readFileSync(${JSON.stringify(sharedRuntimeModulePath)}, 'utf8') !== 'runtime modules are readable') {`,
          "  throw new Error('Runtime node_modules was not readable');",
          '}',
          "process.send?.({ protocol: '1.0', method: 'client.ready', params: { pid: process.pid } });",
          "process.on('message', () => {});"
        ].join('\n')
      )
    ]);
    await symlink(dependencyRoot, path.join(sdkNodeModules, 'runtime-dependency'), 'dir');

    process.env.FASTGPT_PLUGIN_SDK_FACTORY_PATH = sdkRoot;
    vi.doMock('@infrastructure/env', () => ({
      env: {
        LOCAL_FILE_BASE_PATH: configuredCacheRoot
      }
    }));

    const [{ PluginPod }, { ensureSdkFactoryRuntimeDependency }] = await Promise.all([
      import('./index'),
      import('../sdk-factory-runtime')
    ]);
    await ensureSdkFactoryRuntimeDependency({ pluginIndexPath: pluginPath });

    let resolveExit = () => {};
    let stderr = '';
    const exited = new Promise<void>((resolve) => {
      resolveExit = resolve;
    });
    const pod = new PluginPod('runtime-permission-test', {
      pluginPath,
      podTimeout: 1_000,
      maxRequests: 1,
      maxOldSpaceSizeMb: 128,
      terminationGracePeriod: 50,
      maxConcurrentRequests: 1,
      pluginPermissions: [],
      getInvokeSession: () => undefined,
      callbacks: {
        onExit: resolveExit,
        onStderr: (chunk) => {
          stderr += chunk;
        }
      }
    });

    try {
      await pod.start().catch((error: unknown) => {
        throw new Error(`${error instanceof Error ? error.message : String(error)}\n${stderr}`);
      });
      expect(pod.isAvailable()).toBe(true);
    } finally {
      pod.kill('SIGKILL');
      await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1_000))]);
    }
  });
});
