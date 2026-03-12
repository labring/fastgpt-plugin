import { ManifestSchema } from './schemas/tool';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

/**
 * 从 manifest.yaml 加载工具配置
 */
export async function loadManifest(manifestPath: string) {
  const content = await readFile(manifestPath, 'utf-8');
  const manifest = parseYaml(content);

  // 验证 manifest 结构
  return ManifestSchema.parse(manifest);
}
