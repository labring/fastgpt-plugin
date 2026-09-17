import fs from 'node:fs/promises';
import path from 'node:path';

import z from 'zod';

import {
  ModerationManifestSchema,
  type ModerationManifestType,
  ToolManifestSchema,
  type ToolManifestType
} from '@domain/value-objects/plugin/plugin-manifest.vo';

export interface CheckOptions {
  entry: string;
  output: string;
}

export interface CheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 检查构建产物的正确性：
 *  - dist/index.js 存在
 *  - dist/manifest.json 存在且通过 Schema 校验
 *  - manifest.json 引用的 logo 文件存在
 */
export async function checkBuildOutput(options: CheckOptions): Promise<CheckResult> {
  const entryDir = path.resolve(options.entry);
  const outputDir = path.resolve(entryDir, options.output);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!(await pathExists(entryDir))) {
    errors.push(`入口目录不存在: ${entryDir}。请使用 --entry 指向包含 index.ts 的插件源码目录。`);
    return {
      ok: false,
      errors,
      warnings
    };
  }

  const entryIndexPath = path.join(entryDir, 'index.ts');
  if (!(await pathExists(entryIndexPath))) {
    errors.push(`入口目录缺少 index.ts: ${entryIndexPath}。请确认 --entry 指向插件项目根目录。`);
    return {
      ok: false,
      errors,
      warnings
    };
  }

  if (!(await pathExists(outputDir))) {
    errors.push(`构建产物目录不存在: ${outputDir}。请先运行 pnpm run build，或使用 --output 指向 dist 目录。`);
    return {
      ok: false,
      errors,
      warnings
    };
  }

  const indexJsPath = path.join(outputDir, 'index.js');
  if (!(await pathExists(indexJsPath))) {
    errors.push(`缺少构建产物 dist/index.js：${indexJsPath}`);
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  const manifestContent = await readFileSafe(manifestPath);

  if (manifestContent === null) {
    errors.push(`缺少 dist/manifest.json：${manifestPath}`);
  } else {
    let rawManifest: unknown;
    try {
      rawManifest = JSON.parse(manifestContent);
    } catch (e) {
      errors.push(`manifest.json 解析失败（JSON 语法错误）：${(e as Error).message}`);
    }

    if (rawManifest !== undefined) {
      const manifest = parseManifestByType(rawManifest, errors);
      if (manifest) {
        await validateManifestAssets(manifest, outputDir, errors, warnings);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

/** 按 manifest 的 type 选择对应 schema 校验，未知类型报明确错误 */
function parseManifestByType(
  rawManifest: unknown,
  errors: string[]
): ToolManifestType | ModerationManifestType | undefined {
  const typeResult = z.object({ type: z.string() }).safeParse(rawManifest);
  if (!typeResult.success) {
    errors.push('manifest.json 校验失败 [type]: 缺少 type 字段');
    return undefined;
  }

  const { type } = typeResult.data;
  if (type !== 'tool' && type !== 'moderation') {
    errors.push(`不支持的插件类型: ${type}`);
    return undefined;
  }

  const result = (type === 'tool' ? ToolManifestSchema : ModerationManifestSchema).safeParse(
    rawManifest
  );
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`manifest.json 校验失败 [${issue.path.join('.')}]: ${issue.message}`);
    }
    return undefined;
  }

  return result.data;
}

async function validateManifestAssets(
  manifest: ToolManifestType | ModerationManifestType,
  outputDir: string,
  errors: string[],
  warnings: string[]
): Promise<void> {
  const rootIconPath = path.join(outputDir, manifest.icon);
  if (!(await pathExists(rootIconPath))) {
    errors.push(`manifest.json 引用的主 logo 不存在：${manifest.icon}`);
  }

  if (manifest.type === 'tool' && manifest.children && manifest.children.length > 0) {
    for (const child of manifest.children) {
      const childIconPath = path.join(outputDir, child.icon);
      if (!(await pathExists(childIconPath))) {
        errors.push(`manifest.json 中子工具 "${child.id}" 的 logo 不存在：${child.icon}`);
      }
    }
  }

  const readmePath = path.join(outputDir, 'README.md');
  if (!(await pathExists(readmePath))) {
    warnings.push('dist/README.md 不存在');
  }
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
