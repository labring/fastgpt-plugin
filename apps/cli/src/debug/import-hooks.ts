import fs from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];
const RESOLVE_EXTENSIONS = ['', ...SOURCE_EXTENSIONS, '.js', '.mjs', '.cjs', '.json'];

let hooksRegistered = false;

export function ensureDebugImportHooks(): void {
  if (hooksRegistered) {
    return;
  }

  hooksRegistered = true;
  const workspaceRoot = findWorkspaceRoot(path.dirname(fileURLToPath(import.meta.url)));

  registerHooks({
    resolve(specifier, context, nextResolve) {
      const resolved = resolveSpecifier({
        specifier,
        parentURL: context.parentURL,
        workspaceRoot
      });

      if (resolved) {
        return {
          url: resolved,
          shortCircuit: true
        };
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      const parsed = new URL(url);
      const ext = path.extname(parsed.pathname);

      if (SOURCE_EXTENSIONS.includes(ext)) {
        return {
          format: 'module',
          shortCircuit: true,
          source: stripTypeScriptTypes(fs.readFileSync(fileURLToPath(parsed), 'utf-8'), {
            mode: 'transform',
            sourceMap: false
          })
        };
      }

      return nextLoad(url, context);
    }
  });
}

function resolveSpecifier({
  specifier,
  parentURL,
  workspaceRoot
}: {
  specifier: string;
  parentURL?: string;
  workspaceRoot?: string;
}): string | null {
  if (specifier.startsWith('node:')) {
    return null;
  }

  if (specifier.startsWith('file:')) {
    return toFileURL(resolveExistingPath(fileURLToPath(new URL(specifier))));
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (!parentURL?.startsWith('file:')) {
      return null;
    }

    const parentPath = fileURLToPath(new URL(parentURL));
    return toFileURL(resolveExistingPath(path.resolve(path.dirname(parentPath), specifier)));
  }

  if (path.isAbsolute(specifier)) {
    return toFileURL(resolveExistingPath(specifier));
  }

  if (!workspaceRoot) {
    return null;
  }

  return toFileURL(resolveWorkspaceAlias(specifier, workspaceRoot));
}

function resolveWorkspaceAlias(specifier: string, workspaceRoot: string): string | null {
  const exactAliasMap = new Map<string, string>([
    ['@fastgpt-plugin/sdk-factory', path.join(workspaceRoot, 'sdk/factory/src/index.ts')],
    ['@fastgpt-plugin/sdk-client', path.join(workspaceRoot, 'sdk/client/src/index.ts')],
    ['sdk/factory/src', path.join(workspaceRoot, 'sdk/factory/src/index.ts')],
    ['sdk/factory/dist', path.join(workspaceRoot, 'sdk/factory/src/index.ts')],
    ['sdk/client/src', path.join(workspaceRoot, 'sdk/client/src/index.ts')],
    ['sdk/client/dist', path.join(workspaceRoot, 'sdk/client/src/index.ts')]
  ]);

  const prefixAliasMap: Array<[string, string]> = [
    ['@fastgpt-plugin/sdk-factory/', path.join(workspaceRoot, 'sdk/factory/src')],
    ['@fastgpt-plugin/sdk-client/', path.join(workspaceRoot, 'sdk/client/src')],
    ['@domain/', path.join(workspaceRoot, 'packages/domain/src')],
    ['@usecase/', path.join(workspaceRoot, 'packages/usecase/src')],
    ['@shared/', path.join(workspaceRoot, 'packages/shared/src')],
    ['@interface-adapter/', path.join(workspaceRoot, 'packages/interface-adapter/src')],
    ['@infrastructure/', path.join(workspaceRoot, 'packages/infrastructure/src')],
    ['@fastgpt-plugin/cli/', path.join(workspaceRoot, 'apps/cli/src')],
    ['sdk/factory/src/', path.join(workspaceRoot, 'sdk/factory/src')],
    ['sdk/factory/dist/', path.join(workspaceRoot, 'sdk/factory/src')],
    ['sdk/client/src/', path.join(workspaceRoot, 'sdk/client/src')],
    ['sdk/client/dist/', path.join(workspaceRoot, 'sdk/client/src')]
  ];

  const exact = exactAliasMap.get(specifier);
  if (exact) {
    return resolveExistingPath(exact);
  }

  for (const [prefix, targetDir] of prefixAliasMap) {
    if (!specifier.startsWith(prefix)) {
      continue;
    }

    const subPath = specifier.slice(prefix.length);
    return resolveExistingPath(path.join(targetDir, subPath));
  }

  return null;
}

function resolveExistingPath(targetPath: string): string | null {
  const normalizedTarget = path.normalize(targetPath);

  if (fs.existsSync(normalizedTarget) && fs.statSync(normalizedTarget).isFile()) {
    return normalizedTarget;
  }

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = ext ? `${normalizedTarget}${ext}` : normalizedTarget;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  if (fs.existsSync(normalizedTarget) && fs.statSync(normalizedTarget).isDirectory()) {
    for (const ext of RESOLVE_EXTENSIONS.filter(Boolean)) {
      const candidate = path.join(normalizedTarget, `index${ext}`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }

  return null;
}

function toFileURL(targetPath: string | null): string | null {
  if (!targetPath) {
    return null;
  }

  return pathToFileURL(targetPath).href;
}

function findWorkspaceRoot(startDir: string): string | undefined {
  let currentDir = startDir;

  while (true) {
    const sdkFactoryIndex = path.join(currentDir, 'sdk/factory/src/index.ts');
    const domainDir = path.join(currentDir, 'packages/domain/src');

    if (fs.existsSync(sdkFactoryIndex) && fs.existsSync(domainDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}
