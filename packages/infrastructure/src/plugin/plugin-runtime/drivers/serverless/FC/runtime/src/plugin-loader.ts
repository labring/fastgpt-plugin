import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ensureSdkFactoryRuntimeDependency } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/sdk-factory-runtime';

import type { FCRuntimeEnv } from './env';
import { getRuntimeId } from './env';

export type PluginLoaderDeps = {
  downloadArtifact: (targetPath: string) => Promise<void>;
};

export type LoadedPluginFactory = {
  getToolHandler(childId?: string): { handler: (...args: any[]) => Promise<unknown> } | undefined;
};

let loadPromise: Promise<LoadedPluginFactory> | null = null;

export function loadPluginOnce(env: FCRuntimeEnv, deps: PluginLoaderDeps) {
  loadPromise ??= loadPlugin(env, deps);
  return loadPromise;
}

export async function loadPlugin(
  env: FCRuntimeEnv,
  deps: PluginLoaderDeps
): Promise<LoadedPluginFactory> {
  const runtimeId = getRuntimeId(env);
  const runtimeDir = path.join(
    env.FASTGPT_RUNTIME_CACHE_DIR,
    env.PLUGIN_ID,
    env.PLUGIN_VERSION,
    env.PLUGIN_ETAG
  );
  const indexPath = path.join(runtimeDir, 'index.js');
  const markerPath = path.join(runtimeDir, '.artifact-etag');

  if (!(await isWarmCache(markerPath, env.PLUGIN_ETAG))) {
    const tempDir = `${runtimeDir}.tmp-${process.pid}-${Date.now()}`;
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    await deps.downloadArtifact(path.join(tempDir, 'index.js'));
    await fs.writeFile(path.join(tempDir, '.artifact-etag'), env.PLUGIN_ETAG);
    await fs.rm(runtimeDir, { recursive: true, force: true });
    await fs.rename(tempDir, runtimeDir);
  }

  await ensureSdkFactoryRuntimeDependency({
    pluginIndexPath: indexPath,
    searchFrom: env.FASTGPT_PLUGIN_SDK_FACTORY_PATH
  });

  const moduleUrl = `${pathToFileURL(indexPath).href}?runtime=${encodeURIComponent(runtimeId)}`;
  const mod = (await import(moduleUrl)) as { default?: unknown };
  if (!mod.default || typeof mod.default !== 'object' || !('getToolHandler' in mod.default)) {
    throw new Error('Plugin artifact does not export a tool factory');
  }

  return mod.default as LoadedPluginFactory;
}

async function isWarmCache(markerPath: string, etag: string): Promise<boolean> {
  try {
    return (await fs.readFile(markerPath, 'utf8')).trim() === etag;
  } catch {
    return false;
  }
}
