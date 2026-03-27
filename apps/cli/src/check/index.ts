import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ManifestSchema } from '@fastgpt-plugin/helpers/tools/schemas/tool';

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
 *  - manifest.yaml 存在且通过 Schema 校验
 *  - dist/index.js 存在
 *  - dist/config.json 存在且结构正确（单工具 / 工具集）
 *  - config.json 与 manifest.children 的子工具 key 一致
 */
export async function checkBuildOutput(options: CheckOptions): Promise<CheckResult> {
  const entryDir = path.resolve(options.entry);
  const outputDir = path.resolve(options.output);

  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── 1. manifest.yaml ────────────────────────────────────────────────────────
  const manifestPath = path.join(entryDir, 'manifest.yaml');
  let manifest: ReturnType<typeof ManifestSchema.parse> | null = null;

  const manifestContent = await readFileSafe(manifestPath);
  if (manifestContent === null) {
    errors.push(`缺少 manifest.yaml：${manifestPath}`);
  } else {
    let rawManifest: unknown;
    try {
      rawManifest = parseYaml(manifestContent);
    } catch (e) {
      errors.push(`manifest.yaml 解析失败（YAML 语法错误）：${(e as Error).message}`);
    }

    if (rawManifest !== undefined) {
      const result = ManifestSchema.safeParse(rawManifest);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`manifest.yaml 校验失败 [${issue.path.join('.')}]: ${issue.message}`);
        }
      } else {
        manifest = result.data;
      }
    }
  }

  // ─── 2. dist/index.js ────────────────────────────────────────────────────────
  const indexJsPath = path.join(outputDir, 'index.js');
  if (!(await pathExists(indexJsPath))) {
    errors.push(`缺少构建产物 dist/index.js：${indexJsPath}`);
  }

  // ─── 3. dist/config.json ─────────────────────────────────────────────────────
  const configJsonPath = path.join(outputDir, 'config.json');
  const configJsonContent = await readFileSafe(configJsonPath);

  if (configJsonContent === null) {
    errors.push(`缺少 dist/config.json：${configJsonPath}`);
  } else {
    // ─── 4. config.json 结构校验 ───────────────────────────────────────────────
    let config: unknown;
    try {
      config = JSON.parse(configJsonContent);
    } catch (e) {
      errors.push(`dist/config.json 不是合法的 JSON：${(e as Error).message}`);
    }

    if (config !== undefined && typeof config === 'object' && config !== null) {
      const isSingleTool =
        'inputSchema' in config && 'outputSchema' in config;

      if (isSingleTool) {
        // 单工具格式：{ inputSchema: {}, outputSchema: {}, secretSchema?: {} }
        checkJsonSchemaObject(config, 'inputSchema', errors);
        checkJsonSchemaObject(config, 'outputSchema', errors);
        if ('secretSchema' in config) {
          checkJsonSchemaObject(config, 'secretSchema', errors);
        }

        if (manifest?.children && Object.keys(manifest.children).length > 0) {
          errors.push(
            'manifest.yaml 中定义了 children（工具集），但 config.json 是单工具格式'
          );
        }
      } else {
        // 工具集格式：{ tool1: { inputSchema: {}, outputSchema: {} }, ... }
        const configKeys = Object.keys(config);

        if (configKeys.length === 0) {
          errors.push('dist/config.json 为空对象，至少需要一个子工具的 schema');
        }

        for (const key of configKeys) {
          const entry = (config as Record<string, unknown>)[key];
          if (typeof entry !== 'object' || entry === null) {
            errors.push(`config.json["${key}"] 不是对象`);
            continue;
          }
          checkJsonSchemaObject(entry, 'inputSchema', errors, `config.json["${key}"]`);
          checkJsonSchemaObject(entry, 'outputSchema', errors, `config.json["${key}"]`);
          if ('secretSchema' in entry) {
            checkJsonSchemaObject(entry, 'secretSchema', errors, `config.json["${key}"]`);
          }
        }

        if (!manifest?.children || Object.keys(manifest.children).length === 0) {
          warnings.push(
            'dist/config.json 是工具集格式，但 manifest.yaml 中未定义 children'
          );
        } else {
          // 交叉验证 keys
          const manifestKeys = new Set(Object.keys(manifest.children));
          const configKeySet = new Set(configKeys);

          for (const k of manifestKeys) {
            if (!configKeySet.has(k)) {
              errors.push(
                `manifest.yaml children 中的 "${k}" 在 config.json 中缺少对应的 schema`
              );
            }
          }
          for (const k of configKeySet) {
            if (!manifestKeys.has(k)) {
              warnings.push(
                `config.json 中存在 "${k}" 的 schema，但 manifest.yaml children 中未声明此子工具`
              );
            }
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkJsonSchemaObject(
  obj: object,
  key: string,
  errors: string[],
  prefix = 'config.json'
): void {
  const value = (obj as Record<string, unknown>)[key];
  if (value === undefined) {
    errors.push(`${prefix}.${key} 缺失`);
  } else if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${prefix}.${key} 必须是一个对象（JSON Schema），当前类型: ${typeof value}`);
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
