import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { logger } from '@fastgpt-plugin/cli/helpers';
import { build as tsdownBuild } from 'tsdown';
import z from 'zod';

import {
  ToolManifestSchema,
  type ToolManifestType
} from '@domain/value-objects/plugin/plugin-manifest.vo';

export interface ToolBuildOptions {
  entry: string;
  output: string;
  minify: boolean;
  format: 'esm' | 'cjs';
}

export interface ToolBuildResult {
  entryDir: string;
  outputDir: string;
  files: string[];
}

type PackableToolHandler = {
  inputSchema: z.ZodType<any>;
  outputSchema: z.ZodType<any>;
};

type PackableToolChild = {
  id: string;
  description: ToolManifestType['description'];
  name: ToolManifestType['name'];
  icon?: string;
  toolDescription?: string;
};

type PackableToolExport = {
  getUserToolManifest(): Record<string, unknown>;
  getSecretSchema(): z.ZodType<any>;
  getToolHandler(childId?: string): PackableToolHandler | undefined;
  getChildManifests(): PackableToolChild[];
};

type BuildPlan = {
  manifest: ToolManifestType;
  logoFiles: Array<{
    fileName: string;
    sourcePath: string;
  }>;
};

/**
 * 核心构建逻辑：给定入口目录和输出目录，完成一次工具构建。
 *
 * 输出：
 *   dist/index.js
 *   dist/manifest.json
 *   dist/logo.* / dist/<childId>.logo.*
 *   dist/README.md（可选）
 *   dist/assets/**（可选）
 */
export async function buildToolPackage(options: ToolBuildOptions): Promise<ToolBuildResult> {
  const entryDir = path.resolve(options.entry);
  const outputDir = path.resolve(options.output);
  const indexPath = path.join(entryDir, 'index.ts');
  const tempDir = path.join(entryDir, '.build-temp');

  await assertPathExists(entryDir, `入口目录不存在: ${entryDir}`);
  await assertPathExists(indexPath, `找不到 index.ts 文件: ${indexPath}`);

  const tStart = Date.now();
  let tCopy = 0;
  let tBuild = 0;
  let tAssemble = 0;

  try {
    await resetDir(tempDir);

    const tCopyStart = Date.now();
    await copySourceFiles(entryDir, tempDir);
    tCopy = Date.now() - tCopyStart;

    await resetDir(outputDir);

    const tempIndexPath = path.join(tempDir, 'index.ts');
    const tBuildStart = Date.now();
    await tsdownBuild({
      entry: { index: tempIndexPath },
      outDir: outputDir,
      format: [options.format],
      clean: true,
      minify: options.minify,
      inlineOnly: ['*'],
      nodeProtocol: true,
      platform: 'node',
      target: 'node22',
      dts: false,
      treeshake: true,
      noExternal: ['*'],
      outExtensions: () => ({ dts: '.d.ts', js: '.js' })
    });
    tBuild = Date.now() - tBuildStart;

    const tAssembleStart = Date.now();
    const indexJsPath = path.join(outputDir, 'index.js');
    const toolExport = await loadPackableTool(indexJsPath);
    const plan = await createBuildPlan(entryDir, toolExport);
    await fs.writeFile(
      path.join(outputDir, 'manifest.json'),
      JSON.stringify(plan.manifest, null, 2),
      'utf-8'
    );
    await copyLogoFiles(outputDir, plan.logoFiles);
    await copyOptionalStaticFiles(entryDir, outputDir);
    tAssemble = Date.now() - tAssembleStart;

    const files = await collectRelativeFiles(outputDir);
    const tTotal = Date.now() - tStart;

    logger.info(
      [
        '构建阶段耗时统计：',
        `• 源码复制:      ${formatDuration(tCopy)}`,
        `• tsdown 构建:   ${formatDuration(tBuild)}`,
        `• 产物组装:      ${formatDuration(tAssemble)}`,
        `• 总耗时:        ${formatDuration(tTotal)}`
      ].join('\n')
    );

    return {
      entryDir,
      outputDir,
      files
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // noop
    }
  }
}

async function loadPackableTool(indexJsPath: string): Promise<PackableToolExport> {
  await assertPathExists(indexJsPath, `找不到编译产物 index.js：${indexJsPath}`);

  const moduleUrl = `${pathToFileURL(indexJsPath).href}?t=${Date.now()}`;
  const mod = await import(moduleUrl);
  const tool = mod.default;

  if (!isPackableToolExport(tool)) {
    throw new Error(
      'index.ts 的 default export 必须是 defineTool()/defineToolSet() 返回的 factory-sdk 实例'
    );
  }

  return tool;
}

async function createBuildPlan(entryDir: string, tool: PackableToolExport): Promise<BuildPlan> {
  const rootLogoPath = await findRootLogoFile(entryDir);
  if (!rootLogoPath) {
    throw new Error(`找不到主 logo 文件，请在 ${entryDir} 下提供 logo.*`);
  }

  const rootLogoName = path.basename(rootLogoPath);
  const logoFiles = new Map<string, string>([[rootLogoName, rootLogoPath]]);

  const userManifest = tool.getUserToolManifest();
  const secretSchema = z.toJSONSchema(tool.getSecretSchema());
  const toolDescription = pickToolDescription(
    getOptionalString(userManifest.toolDescription),
    userManifest.description
  );
  const childManifests = tool.getChildManifests();

  const manifestCandidate: Record<string, unknown> = {
    ...userManifest,
    type: 'tool',
    icon: rootLogoName,
    toolDescription,
    secretSchema
  };

  if (childManifests.length === 0) {
    const handler = tool.getToolHandler();
    if (!handler) {
      throw new Error('default export 未注册任何工具 handler');
    }

    manifestCandidate.inputSchema = z.toJSONSchema(handler.inputSchema);
    manifestCandidate.outputSchema = z.toJSONSchema(handler.outputSchema);
  } else {
    manifestCandidate.children = await Promise.all(
      childManifests.map(async (child) => {
        const handler = tool.getToolHandler(child.id);
        if (!handler) {
          throw new Error(`找不到子工具 handler: ${child.id}`);
        }

        const childLogoPath = (await findChildLogoFile(entryDir, child.id)) ?? rootLogoPath;
        const childLogoName = path.basename(childLogoPath);
        logoFiles.set(childLogoName, childLogoPath);

        return {
          id: child.id,
          description: child.description,
          name: child.name,
          icon: childLogoName,
          toolDescription: pickToolDescription(child.toolDescription, child.description),
          inputSchema: z.toJSONSchema(handler.inputSchema),
          outputSchema: z.toJSONSchema(handler.outputSchema)
        };
      })
    );
  }

  return {
    manifest: ToolManifestSchema.parse(manifestCandidate),
    logoFiles: [...logoFiles.entries()].map(([fileName, sourcePath]) => ({
      fileName,
      sourcePath
    }))
  };
}

async function copyLogoFiles(
  outputDir: string,
  logoFiles: Array<{ fileName: string; sourcePath: string }>
): Promise<void> {
  await Promise.all(
    logoFiles.map(async ({ fileName, sourcePath }) => {
      await fs.copyFile(sourcePath, path.join(outputDir, fileName));
    })
  );
}

async function copyOptionalStaticFiles(entryDir: string, outputDir: string): Promise<void> {
  const readmePath = path.join(entryDir, 'README.md');
  if (await pathExists(readmePath)) {
    await fs.copyFile(readmePath, path.join(outputDir, 'README.md'));
  }

  const assetsDir = path.join(entryDir, 'assets');
  if (await pathExists(assetsDir)) {
    await copyDirectory(assetsDir, path.join(outputDir, 'assets'));
  }
}

async function copySourceFiles(sourceDir: string, targetDir: string): Promise<void> {
  const files = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const file of files) {
    if (file.name === 'node_modules' || file.name === 'dist' || file.name.startsWith('.build-')) {
      continue;
    }

    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      await ensureDir(targetPath);
      await copySourceFiles(sourcePath, targetPath);
    } else if (file.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function collectRelativeFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRelativeFiles(fullPath, baseDir)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files.sort();
}

async function findRootLogoFile(entryDir: string): Promise<string | null> {
  return findMatchingFile(entryDir, /^logo\./i);
}

async function findChildLogoFile(entryDir: string, childId: string): Promise<string | null> {
  const escapedChildId = escapeRegExp(childId);
  return findMatchingFile(entryDir, new RegExp(`^${escapedChildId}\\.logo\\.`, 'i'));
}

async function findMatchingFile(dir: string, pattern: RegExp): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const matched = entries.find((entry) => entry.isFile() && pattern.test(entry.name));
    return matched ? path.join(dir, matched.name) : null;
  } catch {
    return null;
  }
}

async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function isPackableToolExport(value: unknown): value is PackableToolExport {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getUserToolManifest' in value &&
      typeof value.getUserToolManifest === 'function' &&
      'getSecretSchema' in value &&
      typeof value.getSecretSchema === 'function' &&
      'getToolHandler' in value &&
      typeof value.getToolHandler === 'function' &&
      'getChildManifests' in value &&
      typeof value.getChildManifests === 'function'
  );
}

function pickToolDescription(
  explicitDescription: string | undefined,
  fallbackSource: unknown
): string {
  if (explicitDescription && explicitDescription.trim().length > 0) {
    return explicitDescription;
  }

  if (fallbackSource && typeof fallbackSource === 'object') {
    const localized = fallbackSource as Record<string, unknown>;
    const preferred = [localized['zh-CN'], localized.en, ...Object.values(localized)].find(
      (value) => typeof value === 'string' && value.trim().length > 0
    );

    if (typeof preferred === 'string') {
      return preferred;
    }
  }

  return '';
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function resetDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
  await ensureDir(dir);
}

async function assertPathExists(p: string, message: string): Promise<void> {
  try {
    await fs.access(p);
  } catch {
    throw new Error(message);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
