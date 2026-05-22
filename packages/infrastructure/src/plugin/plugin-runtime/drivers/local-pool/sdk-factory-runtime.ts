import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_FACTORY_PACKAGE = '@fastgpt-plugin/sdk-factory';
const SDK_FACTORY_PATH_ENV = 'FASTGPT_PLUGIN_SDK_FACTORY_PATH';

export interface EnsureSdkFactoryRuntimeOptions {
  pluginIndexPath: string;
  searchFrom?: string;
}

export async function ensureSdkFactoryRuntimeDependency({
  pluginIndexPath,
  searchFrom
}: EnsureSdkFactoryRuntimeOptions): Promise<void> {
  const packageRoot = resolveSdkFactoryPackageRoot(searchFrom);
  const runtimeRoot = resolveRuntimeRoot(pluginIndexPath);
  const targetRoot = path.join(runtimeRoot, 'node_modules', '@fastgpt-plugin');
  const targetPath = path.join(targetRoot, 'sdk-factory');

  if (await packagePointsToSource(packageRoot, targetPath)) {
    return;
  }

  await fs.mkdir(targetRoot, { recursive: true });
  await fs.rm(targetPath, { recursive: true, force: true });

  try {
    await fs.symlink(packageRoot, targetPath, 'junction');
  } catch {
    await copyDirectory(packageRoot, targetPath);
  }
}

export function resolveRuntimeRoot(pluginIndexPath: string): string {
  const pluginRoot = `${path.sep}plugin${path.sep}`;
  const normalizedPath = pathToRequireAnchor(pluginIndexPath);
  const pluginRootIndex = normalizedPath.lastIndexOf(pluginRoot);

  if (pluginRootIndex >= 0) {
    return normalizedPath.slice(0, pluginRootIndex);
  }

  return path.dirname(normalizedPath);
}

export function resolveSdkFactoryPackageRoot(searchFrom?: string): string {
  const packageRoot = resolveOptionalSdkFactoryPackageRoot(searchFrom);

  if (!packageRoot) {
    throw new Error(
      `Cannot find ${SDK_FACTORY_PACKAGE}. Set ${SDK_FACTORY_PATH_ENV} to the built SDK package path.`
    );
  }

  return packageRoot;
}

function resolveOptionalSdkFactoryPackageRoot(searchFrom?: string): string | undefined {
  const configuredPath = process.env[SDK_FACTORY_PATH_ENV];
  if (configuredPath && isPackageRoot(configuredPath, SDK_FACTORY_PACKAGE)) {
    return configuredPath;
  }

  if (searchFrom) {
    const anchorPath = pathToRequireAnchor(searchFrom);
    const packageRoot = findNodeModulesPackageRoot(path.dirname(anchorPath), SDK_FACTORY_PACKAGE);
    if (packageRoot) {
      return packageRoot;
    }
  }

  return (
    findBundledSdkFactoryPackageRoot(process.cwd()) ??
    findWorkspaceSdkFactoryPackageRoot(process.cwd())
  );
}

async function packageExists(packageRoot: string): Promise<boolean> {
  try {
    await fs.access(path.join(packageRoot, 'package.json'));
    return true;
  } catch {
    return false;
  }
}

async function packagePointsToSource(sourceRoot: string, targetRoot: string): Promise<boolean> {
  if (!(await packageExists(targetRoot))) {
    return false;
  }

  try {
    const [sourceRealPath, targetRealPath] = await Promise.all([
      fs.realpath(sourceRoot),
      fs.realpath(targetRoot)
    ]);

    return sourceRealPath === targetRealPath;
  } catch {
    return false;
  }
}

async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
        return;
      }

      if (entry.isSymbolicLink()) {
        await fs.symlink(await fs.readlink(sourcePath), targetPath);
        return;
      }

      if (entry.isFile()) {
        await fs.copyFile(sourcePath, targetPath);
      }
    })
  );
}

function pathToRequireAnchor(sourcePath: string): string {
  const normalizedPath = sourcePath.startsWith('file:') ? fileURLToPath(sourcePath) : sourcePath;

  return path.extname(normalizedPath) ? normalizedPath : path.join(normalizedPath, 'index.js');
}

function findNodeModulesPackageRoot(startDir: string, packageName: string): string | undefined {
  const packagePathParts = packageName.split('/');
  let currentDir = startDir;

  while (true) {
    const candidates = [
      path.join(currentDir, 'node_modules', ...packagePathParts),
      path.join(currentDir, 'node_modules', '.pnpm', 'node_modules', ...packagePathParts)
    ];

    for (const candidate of candidates) {
      if (isPackageRoot(candidate, packageName)) {
        return candidate;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function findBundledSdkFactoryPackageRoot(startDir: string): string | undefined {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, 'dist', 'runtime-sdk', '@fastgpt-plugin', 'sdk-factory');
    if (isPackageRoot(candidate, SDK_FACTORY_PACKAGE)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function findWorkspaceSdkFactoryPackageRoot(startDir: string): string | undefined {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, 'sdk', 'factory');
    if (isPackageRoot(candidate, SDK_FACTORY_PACKAGE)) {
      return candidate;
    }

    const nodeModulesPackageRoot = findNodeModulesPackageRoot(currentDir, SDK_FACTORY_PACKAGE);
    if (nodeModulesPackageRoot) {
      return nodeModulesPackageRoot;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function isPackageRoot(packageRoot: string, packageName: string): boolean {
  const packageJsonPath = path.join(packageRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    name?: string;
  };

  return packageJson.name === packageName;
}
