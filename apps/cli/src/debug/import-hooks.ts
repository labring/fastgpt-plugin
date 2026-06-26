import fs from 'node:fs';
import { createRequire, registerHooks, stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type ts from 'typescript';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];
const RESOLVE_EXTENSIONS = ['', ...SOURCE_EXTENSIONS, '.js', '.mjs', '.cjs', '.json'];
const TRANSFORM_PROBE_SOURCE = 'const __fastgptPluginTransformProbe__: number = 1;';

let hooksRegistered = false;
let transformModeSupported: boolean | undefined;
let cachedTypeScriptCompiler: typeof ts | undefined;
const localRequire = createRequire(import.meta.url);

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
          source: compileTypeScriptModuleSource(fs.readFileSync(fileURLToPath(parsed), 'utf-8'), {
            filePath: fileURLToPath(parsed),
            workspaceRoot
          })
        };
      }

      return nextLoad(url, context);
    }
  });
}

type CompileTypeScriptModuleSourceOptions = {
  filePath: string;
  workspaceRoot?: string;
  stripTypeScriptTypesFn?: typeof stripTypeScriptTypes;
  typeScriptCompiler?: typeof ts;
};

export function compileTypeScriptModuleSource(
  sourceText: string,
  {
    filePath,
    workspaceRoot,
    stripTypeScriptTypesFn = stripTypeScriptTypes,
    typeScriptCompiler
  }: CompileTypeScriptModuleSourceOptions
): string {
  if (supportsTransformMode(stripTypeScriptTypesFn)) {
    try {
      return stripTypeScriptTypesFn(sourceText, {
        mode: 'transform',
        sourceMap: false
      });
    } catch {
      // 旧版 Node 可能不支持 transform，某些 TS 语法也可能超出内建转换能力。
    }
  }

  return transpileTypeScriptModuleSource(sourceText, {
    filePath,
    workspaceRoot,
    typeScriptCompiler
  });
}

function supportsTransformMode(stripTypeScriptTypesFn: typeof stripTypeScriptTypes): boolean {
  if (stripTypeScriptTypesFn === stripTypeScriptTypes) {
    if (transformModeSupported !== undefined) {
      return transformModeSupported;
    }

    transformModeSupported = canTransformTypeScript(stripTypeScriptTypesFn);
    return transformModeSupported;
  }

  return canTransformTypeScript(stripTypeScriptTypesFn);
}

function canTransformTypeScript(stripTypeScriptTypesFn: typeof stripTypeScriptTypes): boolean {
  try {
    stripTypeScriptTypesFn(TRANSFORM_PROBE_SOURCE, {
      mode: 'transform',
      sourceMap: false
    });
    return true;
  } catch {
    return false;
  }
}

function transpileTypeScriptModuleSource(
  sourceText: string,
  {
    filePath,
    workspaceRoot,
    typeScriptCompiler
  }: Pick<
    CompileTypeScriptModuleSourceOptions,
    'filePath' | 'workspaceRoot' | 'typeScriptCompiler'
  >
): string {
  const compiler = typeScriptCompiler ?? loadTypeScriptCompiler(filePath, workspaceRoot);
  const transpiled = compiler.transpileModule(sourceText, {
    fileName: filePath,
    reportDiagnostics: true,
    compilerOptions: {
      module: compiler.ModuleKind.ESNext,
      target: compiler.ScriptTarget.ES2022,
      moduleResolution: compiler.ModuleResolutionKind.Bundler,
      jsx: compiler.JsxEmit.ReactJSX,
      sourceMap: false,
      inlineSourceMap: false,
      inlineSources: false,
      isolatedModules: true,
      esModuleInterop: true,
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true
    }
  });

  const errors =
    transpiled.diagnostics?.filter(
      (diagnostic) => diagnostic.category === compiler.DiagnosticCategory.Error
    ) ?? [];

  if (errors.length > 0) {
    const formatted = errors.map((diagnostic) => formatDiagnosticMessage(compiler, diagnostic)).join('\n');
    throw new Error(`Failed to transpile TypeScript debug module: ${filePath}\n${formatted}`);
  }

  return transpiled.outputText;
}

function loadTypeScriptCompiler(filePath: string, workspaceRoot?: string): typeof ts {
  if (cachedTypeScriptCompiler) {
    return cachedTypeScriptCompiler;
  }

  const resolvePaths = [
    path.dirname(filePath),
    process.cwd(),
    workspaceRoot,
    path.dirname(fileURLToPath(import.meta.url))
  ].filter((value): value is string => Boolean(value));

  const resolved = localRequire.resolve('typescript', {
    paths: resolvePaths
  });
  cachedTypeScriptCompiler = localRequire(resolved) as typeof ts;
  return cachedTypeScriptCompiler;
}

function formatDiagnosticMessage(compiler: typeof ts, diagnostic: ts.Diagnostic): string {
  const message = compiler.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  if (!diagnostic.file || diagnostic.start === undefined) {
    return message;
  }

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return `${line + 1}:${character + 1} ${message}`;
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
